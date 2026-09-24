import { ReactNode, RefObject, useEffect } from "react"
import { gsap } from "gsap"
import { Text } from "../../../components"
import { resolveIcon } from "../../../helpers"
import { API_BASE_URL } from '../../../config'

export const trackLinkClick = (linkId: number) => {
    fetch(`${API_BASE_URL}/metric?link_id=${linkId}`, {method: 'POST'}).catch(() => {})
}

export interface ApiLink {
    id: number;
    store_id: number;
    link: string;
    icon: string | null;
    label: string;
}

export type PageStyle = 'default' | 'cover'

export const PAGE_STYLES: {key: PageStyle; label: string}[] = [
    {key: 'default', label: 'Классический'},
    {key: 'cover', label: 'Обложка'},
]

// Бэкенд может вернуть неизвестное значение — тогда показываем стиль по умолчанию
export const normalizePageStyle = (style: string | null | undefined): PageStyle =>
    PAGE_STYLES.some((s) => s.key === style) ? style as PageStyle : 'default'

export interface StoreData {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    style?: string;
    links: ApiLink[];
}

export interface StoreStyleProps {
    data: StoreData;
    // Вместо публичного списка ссылок — например, редактируемые строки в админке
    children?: ReactNode;
    className?: string;
    animateLinks?: boolean;
}

export const LinkRow = ({id, icon, label, link}: ApiLink) => {
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

export const useLinksAppear = (rootRef: RefObject<HTMLElement | null>, enabled = true) => {
    useEffect(() => {
        if (!enabled) return
        const ctx = gsap.context(() => {
            gsap.set('.link-row', {transition: 'none'})
            gsap.from('.link-row', {
                opacity: 0,
                y: 16,
                duration: 0.5,
                ease: 'power3.out',
                stagger: 0.08,
                delay: 0.15,
                clearProps: 'all',
            })
        }, rootRef)
        return () => ctx.revert()
    }, [rootRef, enabled])
}
