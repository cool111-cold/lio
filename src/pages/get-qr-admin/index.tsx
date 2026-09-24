import { ReactNode, SubmitEvent, useEffect, useState } from "react"
import { PageComponent, Text, Button, Input } from "../../components"
import { resolveIcon, resolveAssetUrl } from "../../helpers"
import settingIcon from '../../assets/icons/setting-icon.svg'
import logoutIcon from '../../assets/icons/logout-icon.svg'
import './style.css'
import { API_BASE_URL } from '../../config'

const extractErrorDetail = async (res: Response): Promise<string | null> => {
    try {
        const data = await res.json()
        return typeof data?.detail === 'string' ? data.detail : null
    } catch {
        return null
    }
}

const pluralize = ({count, forms} : {count: number, forms: any}) => {
        const pr = new Intl.PluralRules('ru-RU');
        const rule = pr.select(count);
      
        switch (rule) {
          case 'one':
            return `${count} ${forms.one}`; 
          case 'few':
            return `${count} ${forms.few}`; 
          case 'many':
          default:
            return `${count} ${forms.many}`; 
        }
}

  


interface ApiLink {
    id: number;
    store_id: number;
    link: string;
    icon: string | null;
    label: string;
    metric: number;
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
    icon: string | null;
    imageFile: File | null;
}

interface ProfileState {
    title: string;
    subtitle: string;
    image: string;
    mail: string;
    imageFile: File | null;
}

interface TemplateSummary {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    isMain: boolean;
}

interface TemplateEditState {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    imageFile: File | null;
}

interface CodeSummary {
    id: number;
    code: string;
    store_id: number | null;
}

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export const Modal = ({title, onClose, children}: ModalProps) => {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <Text size="l" color="white">{title}</Text>
                    <button type="button" className="admin-modal-close" aria-label="Закрыть" onClick={onClose}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                            <path d="M2 2l8 8M10 2l-8 8" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}

interface ImagePickerProps {
    file: File | null;
    fallbackSrc: string | null;
    onChange: (file: File | null) => void;
    shape?: 'circle' | 'square';
    size?: number;
    label?: string;
}

const ImagePicker = ({file, fallbackSrc, onChange, shape = 'circle', size = 96, label = 'Изменить'}: ImagePickerProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null)
            return
        }
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [file])

    const src = previewUrl ?? fallbackSrc

    return (
        <label className={`image-picker image-picker-${shape}`} style={{width: size, height: size}}>
            <input
                type="file"
                accept="image/*"
                className="image-picker-input"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
            {src ? (
                <img className="image-picker-preview" src={src} alt="" />
            ) : (
                <span className="image-picker-plus">+</span>
            )}
            <span className="image-picker-overlay">
                <Text size="xs" color="white">{label}</Text>
            </span>
        </label>
    )
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
        <div className="admin-edit-image-row">
            <ImagePicker
                file={value.imageFile}
                fallbackSrc={value.icon ? resolveIcon(value.icon) : null}
                onChange={(file) => onChange({...value, imageFile: file})}
                shape="square"
                size={64}
                label="Фото"
            />
            <Text size="xs" color="lightGray">Своя иконка для ссылки (необязательно)</Text>
        </div>
        <Input
            placeholder="https://..."
            value={value.link}
            onChange={(e) => onChange({...value, link: e.target.value})}
        />
        <Input
            placeholder="Название (необязательно)"
            value={value.label}
            maxLength={20}
            onChange={(e) => onChange({...value, label: e.target.value})}
        />
        {!value.label && !value.icon && !value.imageFile && <Text size="xs" color="lightGray">Изображение и название автоматически подберем из нашей базы</Text>}
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
    const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)
    const [deletingAccount, setDeletingAccount] = useState(false)

    const [showTemplates, setShowTemplates] = useState(false)
    const [templates, setTemplates] = useState<TemplateSummary[]>([])
    const [templatesLoading, setTemplatesLoading] = useState(false)
    const [templatesBusy, setTemplatesBusy] = useState(false)
    const [templatesError, setTemplatesError] = useState<string | null>(null)
    const [editingTemplate, setEditingTemplate] = useState<TemplateEditState | null>(null)
    const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState<number | null>(null)
    const [showCreateChoice, setShowCreateChoice] = useState(false)

    const [showCodes, setShowCodes] = useState(false)
    const [codes, setCodes] = useState<CodeSummary[]>([])
    const [codesLoading, setCodesLoading] = useState(false)
    const [codesBusy, setCodesBusy] = useState(false)
    const [codesError, setCodesError] = useState<string | null>(null)
    const [confirmUnlinkCode, setConfirmUnlinkCode] = useState<number | null>(null)

    const [showMenu, setShowMenu] = useState(false)

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

    const startEdit = (link: ApiLink) => { setError(null); setEditing({id: link.id, link: link.link, label: link.label, icon: link.icon, imageFile: null}) }
    const startCreate = () => { setError(null); setEditing({id: 'new', link: '', label: '', icon: null, imageFile: null}) }
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

            let body: FormData | undefined
            if (editing.imageFile) {
                body = new FormData()
                body.append('image', editing.imageFile)
            }

            const res = await fetch(url, {method: 'POST', headers: authHeaders, body})
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error((await extractErrorDetail(res)) ?? '')

            setEditing(null)
            await loadStore()
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : 'Не удалось сохранить ссылку')
        } finally {
            setSaving(false)
        }
    }

    const startEditProfile = () => {
        if (!store) return
        setError(null)
        setEditingProfile({title: store.title, subtitle: store.subtitle, image: store.image, mail: clientMail ?? '', imageFile: null})
    }
    const cancelEditProfile = () => {
        setEditingProfile(null)
        setConfirmDeleteAccount(false)
    }

    const submitProfile = async (e: SubmitEvent) => {
        e.preventDefault()
        if (!editingProfile || !store) return

        setSaving(true)
        setError(null)
        try {
            const body = new FormData()
            body.append('title', editingProfile.title)
            body.append('subtitle', editingProfile.subtitle)
            if (editingProfile.imageFile) {
                body.append('image', editingProfile.imageFile)
            }

            const storeRes = await fetch(`${API_BASE_URL}/update-store?store_id=${store.id}`, {
                method: 'POST',
                headers: authHeaders,
                body,
            })
            if (storeRes.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!storeRes.ok) throw new Error((await extractErrorDetail(storeRes)) ?? '')

            const mailRes = await fetch(`${API_BASE_URL}/update-mail?mail=${encodeURIComponent(editingProfile.mail)}`, {
                method: 'POST',
                headers: authHeaders,
            })
            if (mailRes.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!mailRes.ok) throw new Error((await extractErrorDetail(mailRes)) ?? '')

            setEditingProfile(null)
            await loadStore()
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : 'Не удалось сохранить профиль')
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

    const deleteAccount = async () => {
        setDeletingAccount(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/delete-client`, {method: 'POST', headers: authHeaders})
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error('failed')

            onUnauthorized?.()
        } catch {
            setError('Не удалось удалить аккаунт')
            setDeletingAccount(false)
        }
    }

    const loadTemplates = async () => {
        setTemplatesLoading(true)
        setTemplatesError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/get-my-stories?offset=0&limit=100`, {headers: authHeaders})
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error('failed')
            const data = await res.json()
            setTemplates(data.stores ?? [])
        } catch {
            setTemplatesError('Не удалось загрузить шаблоны')
        } finally {
            setTemplatesLoading(false)
        }
    }

    const openTemplates = () => {
        setError(null)
        setShowTemplates(true)
        loadTemplates()
    }

    const closeTemplates = () => {
        setShowTemplates(false)
        setEditingTemplate(null)
        setConfirmDeleteTemplate(null)
        setShowCreateChoice(false)
        setTemplatesError(null)
    }

    const switchTemplate = async (storeId: number) => {
        setTemplatesBusy(true)
        setTemplatesError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/change-main-store?store_id=${storeId}`, {method: 'POST', headers: authHeaders})
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error('failed')
            await loadStore()
            closeTemplates()
        } catch {
            setTemplatesError('Не удалось переключить шаблон')
        } finally {
            setTemplatesBusy(false)
        }
    }

    const createTemplate = async (referenceId?: number) => {
        setTemplatesBusy(true)
        setTemplatesError(null)
        try {
            const url = referenceId
                ? `${API_BASE_URL}/create-store?reference_id=${referenceId}`
                : `${API_BASE_URL}/create-store`
            const res = await fetch(url, {
                method: 'POST',
                headers: {...authHeaders, 'Content-Type': 'application/json'},
                body: referenceId ? undefined : JSON.stringify({title: 'Новый шаблон', subtitle: '', image: ''}),
            })
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error('failed')
            setShowCreateChoice(false)
            await loadTemplates()
        } catch {
            setTemplatesError('Не удалось создать шаблон')
        } finally {
            setTemplatesBusy(false)
        }
    }

    const startEditTemplate = (template: TemplateSummary) => {
        setTemplatesError(null)
        setEditingTemplate({id: template.id, title: template.title, subtitle: template.subtitle, image: template.image, imageFile: null})
    }

    const cancelEditTemplate = () => setEditingTemplate(null)

    const submitEditTemplate = async (e: SubmitEvent) => {
        e.preventDefault()
        if (!editingTemplate) return

        setTemplatesBusy(true)
        setTemplatesError(null)
        try {
            const body = new FormData()
            body.append('title', editingTemplate.title)
            body.append('subtitle', editingTemplate.subtitle)
            if (editingTemplate.imageFile) {
                body.append('image', editingTemplate.imageFile)
            }

            const res = await fetch(`${API_BASE_URL}/update-store?store_id=${editingTemplate.id}`, {
                method: 'POST',
                headers: authHeaders,
                body,
            })
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error((await extractErrorDetail(res)) ?? '')

            const editedId = editingTemplate.id
            setEditingTemplate(null)
            await loadTemplates()
            if (store && editedId === store.id) await loadStore()
        } catch (err) {
            setTemplatesError(err instanceof Error && err.message ? err.message : 'Не удалось сохранить шаблон')
        } finally {
            setTemplatesBusy(false)
        }
    }

    const deleteTemplate = async (storeId: number) => {
        setTemplatesBusy(true)
        setTemplatesError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/delete-store?store_id=${storeId}`, {method: 'POST', headers: authHeaders})
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error((await extractErrorDetail(res)) ?? '')

            setConfirmDeleteTemplate(null)
            await loadTemplates()
        } catch (err) {
            setTemplatesError(err instanceof Error && err.message ? err.message : 'Не удалось удалить шаблон')
        } finally {
            setTemplatesBusy(false)
        }
    }

    const loadCodes = async () => {
        setCodesLoading(true)
        setCodesError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/get-my-codes?offset=0&limit=100`, {headers: authHeaders})
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error('failed')
            const data = await res.json()
            setCodes(data.codes ?? [])
        } catch {
            setCodesError('Не удалось загрузить карты')
        } finally {
            setCodesLoading(false)
        }
    }

    const openCodes = () => {
        setError(null)
        setShowCodes(true)
        loadCodes()
    }

    const closeCodes = () => {
        setShowCodes(false)
        setConfirmUnlinkCode(null)
        setCodesError(null)
    }

    const unlinkCode = async (codeId: number) => {
        setCodesBusy(true)
        setCodesError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/reset-store-from-code?code_id=${codeId}`, {method: 'POST', headers: authHeaders})
            if (res.status === 401) {
                onUnauthorized?.()
                return
            }
            if (!res.ok) throw new Error((await extractErrorDetail(res)) ?? '')

            setConfirmUnlinkCode(null)
            await loadCodes()
        } catch (err) {
            setCodesError(err instanceof Error && err.message ? err.message : 'Не удалось отвязать карту')
        } finally {
            setCodesBusy(false)
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
            <button type="button" className="admin-menu-trigger" aria-label="Меню" onClick={() => setShowMenu((v) => !v)}>
                <img src={settingIcon} alt="" />
            </button>

            {showMenu && (
                <>
                    <div className="admin-menu-overlay" onClick={() => setShowMenu(false)} />
                    <div className="admin-menu-dropdown">
                        <button type="button" className="admin-menu-item" onClick={() => {setShowMenu(false); startEditProfile()}}>
                            <Text size="s" color="white">Изменить профиль</Text>
                        </button>
                        <button type="button" className="admin-menu-item" onClick={() => {setShowMenu(false); openTemplates()}}>
                            <Text size="s" color="white">Мои шаблоны</Text>
                        </button>
                        <button type="button" className="admin-menu-item" onClick={() => {setShowMenu(false); openCodes()}}>
                            <Text size="s" color="white">Мои карты</Text>
                        </button>
                        <div className="admin-menu-divider" />
                        <button type="button" className="admin-menu-item admin-menu-item-icon" onClick={() => {setShowMenu(false); onUnauthorized?.()}}>
                            <img src={logoutIcon} alt="" />
                            <Text size="s" color="white">Выйти</Text>
                        </button>
                    </div>
                </>
            )}

            <div className="admin-scroll">
                <div className="admin-card">
                    <>
                            {store.image && (
                                <div className="get-qr-avatar-wrap">
                                    <img className="get-qr-avatar" src={resolveAssetUrl(store.image)} alt={store.title} />
                                </div>
                            )}
                            <Text size="l" color="white">{store.title}</Text>
                            {store.subtitle && <Text size="s" color="lightGray">{store.subtitle}</Text>}
                            <div className="admin-profile-actions">
                                <button
                                    type="button"
                                    className="admin-edit-btn"
                                    onClick={() => window.open(`${window.location.origin}/${store.id}`, '_blank', 'noopener,noreferrer')}
                                >
                                    <Text size="xs" color="lightGray">Открыть страницу</Text>
                                </button>
                            </div>
                    </>

                    <div className="admin-links">
                        {store.links.map((link) => {
                            const iconSrc = resolveIcon(link.icon)
                            return (
                                <div className="link-row admin-link-row" key={link.id}>
                                    {iconSrc && <img className="link-icon" src={iconSrc} alt="" />}
                                    <div className="admin-link-info">
                                        <Text size="m" color="white">{link.label}</Text>
                                        <span className="admin-link-metric">{pluralize({count: link.metric ?? 0, forms: {one: "переход", few: "перехода", many: "переходов"}})}</span>
                                    </div>
                                    <button type="button" className="admin-edit-btn" onClick={() => startEdit(link)}>
                                        <Text size="xs" color="lightGray">Изменить</Text>
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    <button type="button" className="link-row admin-add-row" onClick={startCreate}>
                        <span className="link-icon admin-add-icon">+</span>
                        <Text size="m" color="lightGray">Добавить ссылку</Text>
                    </button>

                    {error && !editing && !editingProfile && <Text size="xs" color="accent">{error}</Text>}
                </div>
            </div>

            {editing && (
                <Modal title={editing.id === 'new' ? 'Новая ссылка' : 'Редактирование ссылки'} onClose={cancelEdit}>
                    <LinkEditRow
                        value={editing}
                        onChange={setEditing}
                        onSubmit={submitEdit}
                        onCancel={cancelEdit}
                        onDelete={editing.id === 'new' ? undefined : () => deleteLink(editing.id as number)}
                        saving={saving}
                    />
                    {error && <Text size="xs" color="accent">{error}</Text>}
                </Modal>
            )}

            {editingProfile && (
                <Modal title="Редактирование профиля" onClose={cancelEditProfile}>
                    <form className="admin-profile-edit" onSubmit={submitProfile}>
                        <div className="admin-profile-image-row">
                            <ImagePicker
                                file={editingProfile.imageFile}
                                fallbackSrc={resolveAssetUrl(editingProfile.image) || null}
                                onChange={(file) => setEditingProfile({...editingProfile, imageFile: file})}
                                shape="circle"
                                size={96}
                                label="Изменить фото"
                            />
                        </div>
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

                        <div className="admin-danger-zone">
                            {!confirmDeleteAccount ? (
                                <div className="admin-edit-actions">
                                    <button
                                        type="button"
                                        className="admin-edit-btn"
                                        onClick={() => setConfirmDeleteAccount(true)}
                                        disabled={saving || deletingAccount}
                                    >
                                        <Text size="xs" color="accent">Удалить аккаунт</Text>
                                    </button>
                                </div>
                            ) : (
                                <div className="admin-delete-confirm">
                                    <Text size="xs" color="lightGray">Аккаунт и магазин будут удалены без возможности восстановления.</Text>
                                    <div className="admin-edit-actions">
                                        <Button type="button" variant="ghost" textSize="s" textColor="lightGray" onClick={() => setConfirmDeleteAccount(false)} disabled={deletingAccount}>
                                            Отмена
                                        </Button>
                                        <Button type="button" variant="outline" textSize="s" textColor="accent" onClick={deleteAccount} disabled={deletingAccount}>
                                            {deletingAccount ? 'Удаление…' : 'Да, удалить'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                    {error && <Text size="xs" color="accent">{error}</Text>}
                </Modal>
            )}

            {showTemplates && !editingTemplate && (
                <Modal title="Мои шаблоны" onClose={closeTemplates}>
                    <div className="admin-templates-list">
                        {templatesLoading && templates.length === 0 ? (
                            <Text size="s" color="lightGray">Загрузка…</Text>
                        ) : (
                            templates.map((tpl) => (
                                <div
                                    className={`link-row admin-template-row${tpl.isMain ? ' admin-template-row-main' : ''}`}
                                    key={tpl.id}
                                    role={tpl.isMain ? undefined : 'button'}
                                    onClick={tpl.isMain || templatesBusy ? undefined : () => switchTemplate(tpl.id)}
                                >
                                    <div className="admin-template-top">
                                        {tpl.image && <img className="admin-template-thumb" src={resolveAssetUrl(tpl.image)} alt="" />}
                                        <div className="admin-link-info">
                                            <Text size="m" color="white">{tpl.title || 'Без названия'}</Text>
                                            {tpl.subtitle && <Text size="xs" color="lightGray">{tpl.subtitle}</Text>}
                                            {tpl.isMain && <span className="admin-template-badge">Главный</span>}
                                        </div>
                                    </div>
                                    <div className="admin-template-actions">
                                        <button type="button" className="admin-edit-btn" onClick={(e) => {e.stopPropagation(); startEditTemplate(tpl)}} disabled={templatesBusy}>
                                            <Text size="xs" color="lightGray">Изменить</Text>
                                        </button>
                                        {!tpl.isMain && (
                                            confirmDeleteTemplate === tpl.id ? (
                                                <button type="button" className="admin-edit-btn" onClick={(e) => {e.stopPropagation(); deleteTemplate(tpl.id)}} disabled={templatesBusy}>
                                                    <Text size="xs" color="accent">Подтвердить</Text>
                                                </button>
                                            ) : (
                                                <button type="button" className="admin-edit-btn" onClick={(e) => {e.stopPropagation(); setConfirmDeleteTemplate(tpl.id)}} disabled={templatesBusy}>
                                                    <Text size="xs" color="accent">Удалить</Text>
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {showCreateChoice ? (
                        <div className="admin-create-choice">
                            <Text size="xs" color="lightGray">Копия текущего шаблона или пустой?</Text>
                            <div className="admin-template-actions">
                                <button type="button" className="admin-edit-btn" onClick={() => store && createTemplate(store.id)} disabled={templatesBusy || !store}>
                                    <Text size="xs" color="lightGray">Копия текущего</Text>
                                </button>
                                <button type="button" className="admin-edit-btn" onClick={() => createTemplate()} disabled={templatesBusy}>
                                    <Text size="xs" color="lightGray">Пустой шаблон</Text>
                                </button>
                                <button type="button" className="admin-edit-btn" onClick={() => setShowCreateChoice(false)} disabled={templatesBusy}>
                                    <Text size="xs" color="lightGray">Отмена</Text>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button type="button" className="link-row admin-add-row" onClick={() => setShowCreateChoice(true)} disabled={templatesBusy}>
                            <span className="link-icon admin-add-icon">+</span>
                            <Text size="m" color="lightGray">Создать новый шаблон</Text>
                        </button>
                    )}

                    {templatesError && <Text size="xs" color="accent">{templatesError}</Text>}
                </Modal>
            )}

            {editingTemplate && (
                <Modal title="Редактирование шаблона" onClose={cancelEditTemplate}>
                    <form className="admin-profile-edit" onSubmit={submitEditTemplate}>
                        <div className="admin-profile-image-row">
                            <ImagePicker
                                file={editingTemplate.imageFile}
                                fallbackSrc={resolveAssetUrl(editingTemplate.image) || null}
                                onChange={(file) => setEditingTemplate({...editingTemplate, imageFile: file})}
                                shape="circle"
                                size={96}
                                label="Изменить фото"
                            />
                        </div>
                        <Input
                            label="Название"
                            value={editingTemplate.title}
                            onChange={(e) => setEditingTemplate({...editingTemplate, title: e.target.value})}
                        />
                        <Input
                            label="Описание"
                            value={editingTemplate.subtitle}
                            onChange={(e) => setEditingTemplate({...editingTemplate, subtitle: e.target.value})}
                        />
                        <div className="admin-edit-actions">
                            <Button type="button" variant="ghost" textSize="s" textColor="lightGray" onClick={cancelEditTemplate} disabled={templatesBusy}>Отмена</Button>
                            <Button type="submit" variant="solid" textSize="s" disabled={templatesBusy}>
                                {templatesBusy ? 'Сохранение…' : 'Сохранить'}
                            </Button>
                        </div>
                    </form>
                    {templatesError && <Text size="xs" color="accent">{templatesError}</Text>}
                </Modal>
            )}

            {showCodes && (
                <Modal title="Мои карты" onClose={closeCodes}>
                    <div className="admin-templates-list">
                        {codesLoading && codes.length === 0 ? (
                            <Text size="s" color="lightGray">Загрузка…</Text>
                        ) : codes.length === 0 ? (
                            <Text size="s" color="lightGray">Нет привязанных карт</Text>
                        ) : (
                            codes.map((c) => (
                                <div className="link-row admin-code-row" key={c.id}>
                                    <Text size="m" color="white">{c.code}</Text>
                                    {confirmUnlinkCode === c.id ? (
                                        <button type="button" className="admin-edit-btn" onClick={() => unlinkCode(c.id)} disabled={codesBusy}>
                                            <Text size="xs" color="accent">Точно?</Text>
                                        </button>
                                    ) : (
                                        <button type="button" className="admin-edit-btn" onClick={() => setConfirmUnlinkCode(c.id)} disabled={codesBusy}>
                                            <Text size="xs" color="accent">Отвязать</Text>
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {codesError && <Text size="xs" color="accent">{codesError}</Text>}
                </Modal>
            )}

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
