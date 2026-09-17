import { useEffect, useState } from "react"
import { PageComponent, Text } from "../../components"
import { resolveIcon } from "../../helpers"
import './style.css'

const API_URL = 'https://lio-back-viww.onrender.com/get-links'

const getStoreId = (): string => {
    const segments = window.location.pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] ?? ''
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

const LinkRow = ({icon, label, link}: ApiLink) => {
    const iconSrc = resolveIcon(icon)
    return (
        <div className="link-row" onClick={() => window.open(link, "_blank", "noopener,noreferrer")}>
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
            window.location.href = data.links[0].link
        }
    }, [data])

    if (error) {
        return (
            <PageComponent>
                <Text size="s" color="lightGray">Не удалось загрузить ссылки</Text>
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
                            <img className="get-qr-avatar" src={data.image} alt={data.title} />
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
        </PageComponent>
    )
}
