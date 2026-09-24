import { SubmitEvent, useCallback, useEffect, useState } from "react"
import { Text, Button, Input } from "../../../components"
import { resolveIcon } from "../../../helpers"
import { Modal } from "../../get-qr-admin"
import { CrmRequest, ensureOk, getErrorMessage } from "../api"
import { ConfirmButton, ListStatus } from "../components"

interface BaseLink {
    id: number;
    name: string;
    src: string;
    label: string;
}

interface EditingBaseLink {
    id: number | 'new';
    name: string;
    src: string;
    label: string;
}

export const BaseLinksTab = ({request}: {request: CrmRequest}) => {
    const [links, setLinks] = useState<BaseLink[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [editing, setEditing] = useState<EditingBaseLink | null>(null)
    const [editError, setEditError] = useState<string | null>(null)

    const loadLinks = useCallback(async () => {
        setError(null)
        try {
            const res = await request('/crm/get-base-links')
            if (!res) return
            await ensureOk(res, 'Не удалось загрузить базовые ссылки')
            const data = await res.json()
            setLinks(data.base ?? [])
        } catch (err) {
            setError(getErrorMessage(err, 'Не удалось загрузить базовые ссылки'))
        } finally {
            setLoading(false)
        }
    }, [request])

    useEffect(() => {
        loadLinks()
    }, [loadLinks])

    const runAction = async (action: () => Promise<Response | null>, fallback: string) => {
        setBusy(true)
        setActionError(null)
        try {
            const res = await action()
            if (!res) return
            await ensureOk(res, fallback)
            await loadLinks()
        } catch (err) {
            setActionError(getErrorMessage(err, fallback))
        } finally {
            setBusy(false)
        }
    }

    const fillDefaults = () =>
        runAction(() => request('/crm/start-base-links'), 'Не удалось загрузить стандартные ссылки')

    const deleteLink = (linkId: number) =>
        runAction(() => request(`/crm/delete-base-links?link_id=${linkId}`, {method: 'DELETE'}), 'Не удалось удалить ссылку')

    const closeEdit = () => {
        setEditing(null)
        setEditError(null)
    }

    const submitEdit = async (e: SubmitEvent) => {
        e.preventDefault()
        if (!editing) return
        setEditError(null)

        if (!editing.name || !editing.src || !editing.label) {
            setEditError('Заполните все поля')
            return
        }

        setBusy(true)
        try {
            const params = new URLSearchParams({name: editing.name, src: editing.src, label: editing.label})
            const res = editing.id === 'new'
                ? await request(`/crm/create-base-links?${params}`)
                : await request(`/crm/update-base-links?baselink_id=${editing.id}&${params}`, {method: 'POST'})
            if (!res) return
            await ensureOk(res, 'Не удалось сохранить ссылку')

            closeEdit()
            await loadLinks()
        } catch (err) {
            setEditError(getErrorMessage(err, 'Не удалось сохранить ссылку'))
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="crm-list">
            <button
                type="button"
                className="link-row admin-add-row"
                onClick={() => {
                    setEditError(null)
                    setEditing({id: 'new', name: '', src: '', label: ''})
                }}
            >
                <span className="link-icon admin-add-icon">+</span>
                <Text size="m" color="lightGray">Добавить базовую ссылку</Text>
            </button>

            {actionError && <Text size="xs" color="accent">{actionError}</Text>}

            <ListStatus loading={loading} error={error} empty={links.length === 0} emptyText="Базовых ссылок нет" />

            {!loading && !error && links.length === 0 && (
                <Button variant="outline" textSize="s" disabled={busy} onClick={fillDefaults}>
                    {busy ? 'Подождите…' : 'Загрузить стандартные'}
                </Button>
            )}

            {links.map((link) => (
                <div className="link-row admin-link-row" key={link.id}>
                    <img className="link-icon" src={resolveIcon(link.src)} alt="" />
                    <div className="admin-link-info">
                        <Text size="m" color="white">{link.label}</Text>
                        <span className="admin-link-metric">{`${link.name} · ${link.src}`}</span>
                    </div>
                    <div className="crm-row-actions">
                        <button
                            type="button"
                            className="admin-edit-btn"
                            disabled={busy}
                            onClick={() => {
                                setEditError(null)
                                setEditing({...link})
                            }}
                        >
                            <Text size="xs" color="lightGray">Изменить</Text>
                        </button>
                        <ConfirmButton label="Удалить" disabled={busy} onConfirm={() => deleteLink(link.id)} />
                    </div>
                </div>
            ))}

            {editing && (
                <Modal title={editing.id === 'new' ? 'Новая базовая ссылка' : 'Редактирование ссылки'} onClose={closeEdit}>
                    <form className="admin-profile-edit" onSubmit={submitEdit}>
                        <div className="admin-edit-image-row">
                            <img className="link-icon" src={resolveIcon(editing.src)} alt="" />
                            <Text size="xs" color="lightGray">Иконка подставится в ссылки клиентов с этим доменом</Text>
                        </div>
                        <Input
                            label="Домен"
                            placeholder="t.me"
                            value={editing.name}
                            onChange={(e) => setEditing({...editing, name: e.target.value})}
                        />
                        <Input
                            label="Иконка"
                            placeholder="./icons/tg.svg"
                            value={editing.src}
                            onChange={(e) => setEditing({...editing, src: e.target.value})}
                        />
                        <Input
                            label="Название"
                            placeholder="Телеграм"
                            value={editing.label}
                            onChange={(e) => setEditing({...editing, label: e.target.value})}
                        />

                        {editError && <Text size="xs" color="accent">{editError}</Text>}

                        <div className="admin-edit-actions">
                            <Button type="button" variant="ghost" textSize="s" textColor="lightGray" onClick={closeEdit} disabled={busy}>Отмена</Button>
                            <Button type="submit" variant="solid" textSize="s" disabled={busy}>
                                {busy ? 'Сохранение…' : 'Сохранить'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    )
}
