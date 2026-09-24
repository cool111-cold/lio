import { SubmitEvent, useCallback, useEffect, useState } from "react"
import { Text, Button, Input } from "../../../components"
import { Modal } from "../../get-qr-admin"
import { CrmRequest, CrmStatus, CrmUser, ensureOk, getErrorMessage } from "../api"
import { ListStatus } from "../components"

interface EditingUser {
    id: number | 'new';
    login: string;
    password: string;
    status: CrmStatus;
}

export const STATUS_LABELS: Record<CrmStatus, string> = {
    user: 'Пользователь',
    admin: 'Администратор',
}

interface StatusSwitchProps {
    value: CrmStatus;
    onChange: (value: CrmStatus) => void;
    disabled?: boolean;
}

const StatusSwitch = ({value, onChange, disabled}: StatusSwitchProps) => (
    <div className="admin-login-tabs">
        {(Object.keys(STATUS_LABELS) as CrmStatus[]).map((status) => (
            <div key={status} className={`admin-login-tab${value === status ? ' admin-login-tab-active' : ''}`}>
                <Button
                    variant="ghost"
                    fullWidth
                    textSize="s"
                    textColor={value === status ? 'white' : 'lightGray'}
                    disabled={disabled}
                    onClick={() => onChange(status)}
                >
                    {STATUS_LABELS[status]}
                </Button>
            </div>
        ))}
    </div>
)

interface UsersTabProps {
    request: CrmRequest;
    me: CrmUser;
    onMeChange: (user: CrmUser) => void;
}

export const UsersTab = ({request, me, onMeChange}: UsersTabProps) => {
    const [users, setUsers] = useState<CrmUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editing, setEditing] = useState<EditingUser | null>(null)
    const [editError, setEditError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const loadUsers = useCallback(async () => {
        setError(null)
        try {
            const res = await request('/crm/get-users')
            if (!res) return
            await ensureOk(res, 'Не удалось загрузить пользователей')
            const data = await res.json()
            setUsers(data.users ?? [])
        } catch (err) {
            setError(getErrorMessage(err, 'Не удалось загрузить пользователей'))
        } finally {
            setLoading(false)
        }
    }, [request])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    const startCreate = () => {
        setEditError(null)
        setConfirmDelete(false)
        setEditing({id: 'new', login: '', password: '', status: 'user'})
    }

    const startEdit = (user: CrmUser) => {
        setEditError(null)
        setConfirmDelete(false)
        setEditing({id: user.id, login: user.login, password: '', status: user.status})
    }

    const closeEdit = () => {
        setEditing(null)
        setEditError(null)
        setConfirmDelete(false)
    }

    const submitEdit = async (e: SubmitEvent) => {
        e.preventDefault()
        if (!editing) return
        setEditError(null)

        if (!editing.login) {
            setEditError('Укажите логин')
            return
        }
        if (editing.id === 'new' && !editing.password) {
            setEditError('Укажите пароль')
            return
        }

        setSaving(true)
        try {
            const isNew = editing.id === 'new'
            const body = isNew
                ? {login: editing.login, password: editing.password, status: editing.status}
                : {login: editing.login, password: editing.password || undefined, status: editing.status}
            const res = await request(isNew ? '/crm/create-user' : `/crm/update-user?user_id=${editing.id}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            })
            if (!res) return
            await ensureOk(res, 'Не удалось сохранить пользователя')

            const data = await res.json()
            if (data.user?.id === me.id) onMeChange(data.user)
            closeEdit()
            await loadUsers()
        } catch (err) {
            setEditError(getErrorMessage(err, 'Не удалось сохранить пользователя'))
        } finally {
            setSaving(false)
        }
    }

    const deleteUser = async (userId: number) => {
        setSaving(true)
        setEditError(null)
        try {
            const res = await request(`/crm/delete-user?user_id=${userId}`, {method: 'DELETE'})
            if (!res) return
            await ensureOk(res, 'Не удалось удалить пользователя')

            closeEdit()
            await loadUsers()
        } catch (err) {
            setEditError(getErrorMessage(err, 'Не удалось удалить пользователя'))
        } finally {
            setSaving(false)
        }
    }

    const isSelf = editing !== null && editing.id === me.id

    return (
        <div className="crm-list">
            <ListStatus loading={loading} error={error} empty={users.length === 0} emptyText="Пользователей пока нет" />

            {users.map((user) => (
                <div className="link-row admin-link-row" key={user.id}>
                    <div className="admin-link-info">
                        <Text size="m" color="white">{user.login}</Text>
                        <span className="admin-link-metric">
                            {STATUS_LABELS[user.status]}{user.id === me.id ? ' · это вы' : ''}
                        </span>
                    </div>
                    <button type="button" className="admin-edit-btn" onClick={() => startEdit(user)}>
                        <Text size="xs" color="lightGray">Изменить</Text>
                    </button>
                </div>
            ))}

            <button type="button" className="link-row admin-add-row" onClick={startCreate}>
                <span className="link-icon admin-add-icon">+</span>
                <Text size="m" color="lightGray">Добавить пользователя</Text>
            </button>

            {editing && (
                <Modal title={editing.id === 'new' ? 'Новый пользователь' : 'Редактирование пользователя'} onClose={closeEdit}>
                    <form className="admin-profile-edit" onSubmit={submitEdit}>
                        <Input
                            label="Логин"
                            autoComplete="off"
                            value={editing.login}
                            onChange={(e) => setEditing({...editing, login: e.target.value})}
                        />
                        <Input
                            label={editing.id === 'new' ? 'Пароль' : 'Новый пароль (необязательно)'}
                            secureToggle
                            autoComplete="new-password"
                            value={editing.password}
                            onChange={(e) => setEditing({...editing, password: e.target.value})}
                        />
                        <StatusSwitch
                            value={editing.status}
                            disabled={saving || isSelf}
                            onChange={(status) => setEditing({...editing, status})}
                        />
                        {isSelf && <Text size="xs" color="lightGray">Нельзя снять права администратора с себя</Text>}

                        {editError && <Text size="xs" color="accent">{editError}</Text>}

                        <div className="admin-edit-actions">
                            <Button type="button" variant="ghost" textSize="s" textColor="lightGray" onClick={closeEdit} disabled={saving}>Отмена</Button>
                            <Button type="submit" variant="solid" textSize="s" disabled={saving}>
                                {saving ? 'Сохранение…' : 'Сохранить'}
                            </Button>
                        </div>

                        {editing.id !== 'new' && !isSelf && (
                            <div className="admin-danger-zone">
                                {!confirmDelete ? (
                                    <button type="button" className="admin-edit-btn" onClick={() => setConfirmDelete(true)} disabled={saving}>
                                        <Text size="xs" color="accent">Удалить пользователя</Text>
                                    </button>
                                ) : (
                                    <div className="admin-delete-confirm">
                                        <Text size="xs" color="lightGray">{`Удалить пользователя ${editing.login}? Это действие нельзя отменить.`}</Text>
                                        <div className="admin-edit-actions">
                                            <Button type="button" variant="ghost" textSize="s" textColor="lightGray" onClick={() => setConfirmDelete(false)} disabled={saving}>Отмена</Button>
                                            <Button type="button" variant="solid" textSize="s" onClick={() => deleteUser(editing.id as number)} disabled={saving}>
                                                {saving ? 'Удаление…' : 'Удалить'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </Modal>
            )}
        </div>
    )
}
