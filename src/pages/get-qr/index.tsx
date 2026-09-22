import { useEffect, useState } from "react"
import { PageComponent, Text } from "../../components"
import { resolveIcon, resolveAssetUrl } from "../../helpers"
import './style.css'
import { API_BASE_URL } from '../../config'

const API_URL = `${API_BASE_URL}/get-links`

const getStoreId = (): string => {
    const segments = window.location.pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] ?? ''
}

const trackLinkClick = (linkId: number) => {
    fetch(`${API_BASE_URL}/metric?link_id=${linkId}`, {method: 'POST'}).catch(() => {})
}

interface ApiLink {
    id: number;
    store_id: number;
    link: string;
    icon: string;
    label: string;
}

interface StoreData {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    links: ApiLink[];
}

const LinkRow = ({id, icon, label, link}: ApiLink) => {
    const iconSrc = resolveIcon(icon)
    const handleClick = () => {
        trackLinkClick(id)
        window.open(link, "_blank", "noopener,noreferrer")
    }
    return (
        <div className="link-row" onClick={handleClick}>
            {iconSrc && <img className="link-icon" src={iconSrc} alt="" />}
            <Text size="m" color="white">{label}</Text>
            <span className="link-arrow">→</span>
        </div>
    )
}

const LoadComponent = ({text}: {text: string}) => (
    <div className="get-qr-loader">
        <span className="loader-spinner" />
        <Text size="s" color="lightGray">{text}</Text>
    </div>
)

export const GetQrPage = () => {
    const [data, setData] = useState<StoreData | null>(null)
    const [error, setError] = useState(false)
    const [promoClosed, setPromoClosed] = useState(false)
    const isAdmin = !!localStorage.getItem('qr_admin_token')

    useEffect(() => {
        const storeId = getStoreId()

        fetch(`${API_URL}?store_id=${storeId}`)
            .then((res) => {
                if (!res.ok) throw new Error('request failed')
                return res.json()
            })
            .then((json: StoreData) => setData(json))
            .catch(() => setError(true))
    }, [])

    useEffect(() => {
        if (data && data.links.length === 1) {
            trackLinkClick(data.links[0].id)
            window.location.href = data.links[0].link
        }
    }, [data])

    if (error) {
        return (
            <PageComponent>
                <Text size="m" color="lightGray">Не нашли такую ссылку</Text>
            </PageComponent>
        )
    }

    if (!data) {
        return (
            <PageComponent>
                <LoadComponent text="Загрузка…" />
            </PageComponent>
        )
    }

    if (data.links.length === 1) {
        return (
            <PageComponent>
                <LoadComponent text="Открываем ссылку…" />
            </PageComponent>
        )
    }

    return (
        <PageComponent center={false}>
            <div className="get-qr-scroll">
                <div className="get-qr-card">
                    {data.image && (
                        <div className="get-qr-avatar-wrap">
                            <img className="get-qr-avatar" src={resolveAssetUrl(data.image)} alt={data.title} />
                        </div>
                    )}
                    {data.title && <Text size="l" color="white">{data.title}</Text>}
                    {data.subtitle && <Text size="s" color="lightGray">{data.subtitle}</Text>}
                    <div className="get-qr-links">
                        {data.links.map((link) => (
                            <LinkRow key={link.id} {...link} />
                        ))}
                    </div>
                </div>
            </div>
            {!promoClosed && (
                <div className="get-qr-promo" onClick={() => { window.location.href = isAdmin ? '/admin' : '/' }}>
                    <Text size="xs" color="lightGray">{isAdmin ? 'Войти в Админ-панель' : 'Хотите такую же карту?'}</Text>
                    <button
                        type="button"
                        className="get-qr-promo-close"
                        aria-label="Закрыть"
                        onClick={(e) => { e.stopPropagation(); setPromoClosed(true) }}
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                            <path d="M2 2l8 8M10 2l-8 8" />
                        </svg>
                    </button>
                </div>
            )}
        </PageComponent>
    )
}
