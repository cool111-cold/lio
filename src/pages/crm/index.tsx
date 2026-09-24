import { useEffect, useState } from "react"
import { PageComponent, Text } from "../../components"
import logoutIcon from '../../assets/icons/logout-icon.svg'
import '../get-qr-admin/login.css'
import '../get-qr-admin/style.css'
import './style.css'
import { CrmUser, getErrorMessage, useCrmRequest } from "./api"
import { STATUS_LABELS, UsersTab } from "./tabs/users"
import { ClientsTab } from "./tabs/clients"
import { StoresTab } from "./tabs/stores"
import { CodesTab } from "./tabs/codes"
import { BaseLinksTab } from "./tabs/base-links"

type TabKey = 'users' | 'clients' | 'stores' | 'codes' | 'base-links'

const TABS: {key: TabKey; label: string}[] = [
    {key: 'users', label: 'Сотрудники'},
    {key: 'clients', label: 'Клиенты'},
    {key: 'stores', label: 'Страницы'},
    {key: 'codes', label: 'Карты'},
    {key: 'base-links', label: 'Базовые ссылки'},
]

const getTabFromHash = (): TabKey => {
    const hash = window.location.hash.slice(1)
    return TABS.some((tab) => tab.key === hash) ? hash as TabKey : 'users'
}

interface CrmPageProps {
    token: string;
    onUnauthorized?: () => void;
}

export const CrmPage = ({token, onUnauthorized}: CrmPageProps) => {
    const request = useCrmRequest(token, onUnauthorized)
    const [me, setMe] = useState<CrmUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<TabKey>(getTabFromHash)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await request('/crm/me')
                if (!res) return
                if (!res.ok) throw new Error('Не удалось загрузить профиль')
                const data = await res.json()
                setMe(data.user)
            } catch (err) {
                setError(getErrorMessage(err, 'Не удалось загрузить данные'))
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [request])

    const selectTab = (key: TabKey) => {
        setTab(key)
        window.history.replaceState(null, '', `#${key}`)
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

    if (!me) {
        return (
            <PageComponent>
                <Text size="s" color="lightGray">{error ?? 'Не удалось загрузить данные'}</Text>
            </PageComponent>
        )
    }

    const isAdmin = me.status === 'admin'

    return (
        <PageComponent center={false}>
            <button type="button" className="admin-menu-trigger" aria-label="Выйти" onClick={() => onUnauthorized?.()}>
                <img src={logoutIcon} alt="" />
            </button>

            <div className="admin-scroll">
                <div className="admin-card crm-card">
                    <Text size="l" color="white">CRM</Text>
                    <Text size="s" color="lightGray">{`${me.login} · ${STATUS_LABELS[me.status]}`}</Text>

                    {isAdmin ? (
                        <>
                            <div className="crm-tabs" role="tablist">
                                {TABS.map(({key, label}) => (
                                    <button
                                        key={key}
                                        type="button"
                                        role="tab"
                                        aria-selected={tab === key}
                                        className={`crm-tab${tab === key ? ' crm-tab-active' : ''}`}
                                        onClick={() => selectTab(key)}
                                    >
                                        <Text size="s" color={tab === key ? 'white' : 'lightGray'}>{label}</Text>
                                    </button>
                                ))}
                            </div>

                            {tab === 'users' && <UsersTab request={request} me={me} onMeChange={setMe} />}
                            {tab === 'clients' && <ClientsTab request={request} />}
                            {tab === 'stores' && <StoresTab request={request} />}
                            {tab === 'codes' && <CodesTab request={request} />}
                            {tab === 'base-links' && <BaseLinksTab request={request} />}
                        </>
                    ) : (
                        <Text size="s" color="lightGray">Разделы CRM доступны только администраторам</Text>
                    )}
                </div>
            </div>
        </PageComponent>
    )
}
