import { SubmitEvent, useEffect, useState } from "react"
import { PageComponent, Text, Button, Input } from "../../components"
import { resolveIcon } from "../../helpers"
import './style.css'

const API_BASE_URL = 'https://lio-back-viww.onrender.com'

interface ApiLink {
    id: number;
    store_id: number;
    link: string;
    icon: string | null;
    label: string;
}

interface StoreData {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    links: ApiLink[];
}

interface EditingState {
    id: number | 'new';
    link: string;
    label: string;
}

interface ProfileState {
    title: string;
    subtitle: string;
    image: string;
    mail: string;
}

interface LinkEditRowProps {
    value: EditingState;
    onChange: (value: EditingState) => void;
    onSubmit: (e: SubmitEvent) => void;
    onCancel: () => void;
    onDelete?: () => void;
    saving: boolean;
}

const LinkEditRow = ({value, onChange, onSubmit, onCancel, onDelete, saving}: LinkEditRowProps) => (
    <form className="admin-edit-row" onSubmit={onSubmit}>
        <Input
            placeholder="https://..."
            value={value.link}
            onChange={(e) => onChange({...value, link: e.target.value})}
        />
        <Input
            placeholder="Название (необязательно)"
            value={value.label}
            onChange={(e) => onChange({...value, label: e.target.value})}
        />
        <div className="admin-edit-actions">
            {onDelete && (
                <Button type="button" variant="ghost" textSize="s" textColor="lightGray" onClick={onDelete} disabled={saving}>Удалить</Button>
            )}
            <Button type="button" variant="ghost" textSize="s" textColor="lightGray" onClick={onCancel} disabled={saving}>Отмена</Button>
            <Button type="submit" variant="solid" textSize="s" disabled={saving || !value.link}>
                {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
        </div>
    </form>
)

interface GetQrAdminPageProps {
    token: string;
    onUnauthorized?: () => void;
}

export const GetQrAdminPage = ({token, onUnauthorized}: GetQrAdminPageProps) => {
    const [store, setStore] = useState<StoreData | null>(null)
    const [clientMail, setClientMail] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editing, setEditing] = useState<EditingState | null>(null)
    const [editingProfile, setEditingProfile] = useState<ProfileState | null>(null)
    const [saving, setSaving] = useState(false)

    const authHeaders = {Authorization: `Bearer ${token}`}

    const loadStore = async () => {
        setLoading(true)
        setError(null)
        try {
            const storeRes = await fetch(`${API_BASE_URL}/get-my-store`, {headers: authHeaders})
            if (storeRes.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!storeRes.ok) throw new Error('failed')
            const {store_id, mail} = await storeRes.json()
            setClientMail(mail ?? '')

            const linksRes = await fetch(`${API_BASE_URL}/get-links?store_id=${store_id}`)
            if (!linksRes.ok) throw new Error('failed')
            const data: StoreData = await linksRes.json()
            setStore(data)
        } catch {
            setError('Не удалось загрузить данные')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStore()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    const startEdit = (link: ApiLink) => setEditing({id: link.id, link: link.link, label: link.label})
    const startCreate = () => setEditing({id: 'new', link: '', label: ''})
    const cancelEdit = () => setEditing(null)

    const submitEdit = async (e: SubmitEvent) => {

        e.preventDefault()
        if (!editing || !editing.link) return

        setSaving(true)
        setError(null)
        try {
            const params = new URLSearchParams({link: editing.link})
            if (editing.label) params.set('label', editing.label)

            const url = editing.id === 'new'
                ? `${API_BASE_URL}/create-link?${params.toString()}`
                : `${API_BASE_URL}/update-link?link_id=${editing.id}&${params.toString()}`

            const res = await fetch(url, {method: 'POST', headers: authHeaders})
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error('failed')

            setEditing(null)
            await loadStore()
        } catch {
            setError('Не удалось сохранить ссылку')
        } finally {
            setSaving(false)
        }
    }

    const startEditProfile = () => {
        if (!store) return
        setEditingProfile({title: store.title, subtitle: store.subtitle, image: store.image, mail: clientMail ?? ''})
    }
    const cancelEditProfile = () => setEditingProfile(null)

    const submitProfile = async (e: SubmitEvent) => {
        e.preventDefault()
        if (!editingProfile || !store) return

        setSaving(true)
        setError(null)
        try {
            const storeRes = await fetch(`${API_BASE_URL}/update-store?store_id=${store.id}`, {
                method: 'POST',
                headers: {...authHeaders, 'Content-Type': 'application/json'},
                body: JSON.stringify({title: editingProfile.title, subtitle: editingProfile.subtitle, image: editingProfile.image}),
            })
            if (storeRes.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!storeRes.ok) throw new Error('failed')

            const mailRes = await fetch(`${API_BASE_URL}/update-mail?mail=${encodeURIComponent(editingProfile.mail)}`, {
                method: 'POST',
                headers: authHeaders,
            })
            if (mailRes.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!mailRes.ok) throw new Error('failed')

            setEditingProfile(null)
            await loadStore()
        } catch {
            setError('Не удалось сохранить профиль')
        } finally {
            setSaving(false)
        }
    }

    const deleteLink = async (linkId: number) => {
        setSaving(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/delete-link?link_id=${linkId}`, {method: 'POST', headers: authHeaders})
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error('failed')

            setEditing(null)
            await loadStore()
        } catch {
            setError('Не удалось удалить ссылку')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <PageComponent>
                <div className="admin-loader">
                    <span className="loader-spinner" />
                    <Text size="s" color="lightGray">Загрузка…</Text>
                </div>
            </PageComponent>
        )
    }

    if (error && !store) {
        return (
            <PageComponent>
                <Text size="s" color="lightGray">{error}</Text>
            </PageComponent>
        )
    }

    if (!store) return null

    return (
        <PageComponent center={false}>
            <div className="admin-scroll">
                <div className="admin-card">
                    {editingProfile ? (
                        <form className="admin-profile-edit" onSubmit={submitProfile}>
                            <Input
                                label="Название"
                                value={editingProfile.title}
                                onChange={(e) => setEditingProfile({...editingProfile, title: e.target.value})}
                            />
                            <Input
                                label="Описание"
                                value={editingProfile.subtitle}
                                onChange={(e) => setEditingProfile({...editingProfile, subtitle: e.target.value})}
                            />
                            <Input
                                label="Ссылка на аватар"
                                placeholder="https://..."
                                value={editingProfile.image}
                                onChange={(e) => setEditingProfile({...editingProfile, image: e.target.value})}
                            />
                            <Input
                                label="Почта"
                                type="email"
                                placeholder="you@example.com"
                                value={editingProfile.mail}
                                onChange={(e) => setEditingProfile({...editingProfile, mail: e.target.value})}
                            />
                            <div className="admin-edit-actions">
                                <Button type="button" variant="ghost" textSize="s" textColor="lightGray" onClick={cancelEditProfile} disabled={saving}>Отмена</Button>
                                <Button type="submit" variant="solid" textSize="s" disabled={saving}>
                                    {saving ? 'Сохранение…' : 'Сохранить'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <>
                            {store.image && (
                                <div className="get-qr-avatar-wrap">
                                    <img className="get-qr-avatar" src={store.image} alt={store.title} />
                                </div>
                            )}
                            <Text size="l" color="white">{store.title}</Text>
                            {store.subtitle && <Text size="s" color="lightGray">{store.subtitle}</Text>}
                            <div className="admin-profile-actions">
                                <button type="button" className="admin-edit-btn" onClick={startEditProfile}>
                                    <Text size="xs" color="lightGray">Изменить профиль</Text>
                                </button>
                                <button
                                    type="button"
                                    className="admin-edit-btn"
                                    onClick={() => window.open(`${window.location.origin}/${store.id}`, '_blank', 'noopener,noreferrer')}
                                >
                                    <Text size="xs" color="lightGray">Открыть страницу</Text>
                                </button>
                            </div>
                        </>
                    )}

                    <div className="admin-links">
                        {store.links.map((link) => {
                            if (editing?.id === link.id) {
                                return (
                                    <LinkEditRow
                                        key={link.id}
                                        value={editing}
                                        onChange={setEditing}
                                        onSubmit={submitEdit}
                                        onCancel={cancelEdit}
                                        onDelete={() => deleteLink(link.id)}
                                        saving={saving}
                                    />
                                )
                            }

                            const iconSrc = resolveIcon(link.icon)
                            return (
                                <div className="link-row admin-link-row" key={link.id}>
                                    {iconSrc && <img className="link-icon" src={iconSrc} alt="" />}
                                    <Text size="m" color="white">{link.label}</Text>
                                    <button type="button" className="admin-edit-btn" onClick={() => startEdit(link)}>
                                        <Text size="xs" color="lightGray">Изменить</Text>
                                    </button>
                                </div>
                            )
                        })}

                        {editing?.id === 'new' && (
                            <LinkEditRow
                                value={editing}
                                onChange={setEditing}
                                onSubmit={submitEdit}
                                onCancel={cancelEdit}
                                saving={saving}
                            />
                        )}
                    </div>

                    {!editing && (
                        <button type="button" className="link-row admin-add-row" onClick={startCreate}>
                            <span className="link-icon admin-add-icon">+</span>
                            <Text size="m" color="lightGray">Добавить ссылку</Text>
                        </button>
                    )}

                    {error && <Text size="xs" color="accent">{error}</Text>}
                </div>
            </div>

            {!editingProfile && !clientMail && (
                <div className="admin-mail-notice">
                    <Text size="xs" color="lightGray">Добавьте почту, чтобы не потерять доступ к аккаунту</Text>
                    <button type="button" className="admin-edit-btn" onClick={startEditProfile}>
                        <Text size="xs" color="accent">Добавить</Text>
                    </button>
                </div>
            )}
        </PageComponent>
    )
}
