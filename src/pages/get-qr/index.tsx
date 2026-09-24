import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { PageComponent, Text } from "../../components"
import './style.css'
import { API_BASE_URL } from '../../config'
import { StoreData, trackLinkClick } from './components/link-row'
import { DefaultStyle } from './components/default-style'
import { CoverStyle } from "./components/cover-style"

const API_URL = `${API_BASE_URL}/get-links`

const getStoreId = (): string => {
    const segments = window.location.pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] ?? ''
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
    const promoRef = useRef<HTMLDivElement>(null)

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

    useEffect(() => {
        if (!promoRef.current) return
        const tween = gsap.fromTo(promoRef.current,
            {xPercent: -50, x: 0, y: 40, opacity: 0},
            {y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 1.2, clearProps: 'transform,opacity'},
        )
        return () => { tween.kill() }
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
                <DefaultStyle data={data} />
                {/* <CoverStyle data={data} /> */}
            </div>
            {!promoClosed && (
                <div ref={promoRef} className="get-qr-promo" onClick={() => { window.location.href = isAdmin ? '/admin' : '/' }}>
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
