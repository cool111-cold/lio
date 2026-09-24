import { RefObject, useEffect } from "react"
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
    icon: string;
    label: string;
}

export interface StoreData {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    links: ApiLink[];
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

export const useLinksAppear = (rootRef: RefObject<HTMLElement | null>) => {
    useEffect(() => {
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
    }, [rootRef])
}
