import { useRef } from "react"
import { Text } from "../../../components"
import { resolveAssetUrl } from "../../../helpers"
import { LinkRow, StoreStyleProps, useLinksAppear } from "./link-row"

export const DefaultStyle = ({data, children, className, animateLinks = true}: StoreStyleProps) => {
    const rootRef = useRef<HTMLDivElement>(null)
    useLinksAppear(rootRef, animateLinks)

    return (
        <div ref={rootRef} className={`get-qr-card${className ? ` ${className}` : ''}`}>
            {data.image && (
                <div className="get-qr-avatar-wrap">
                    <img className="get-qr-avatar" src={resolveAssetUrl(data.image)} alt={data.title} />
                </div>
            )}
            {data.title && <Text size="l" color="white">{data.title}</Text>}
            {data.subtitle && <Text size="s" color="lightGray">{data.subtitle}</Text>}
            <div className="get-qr-links">
                {children ?? data.links.map((link) => (
                    <LinkRow key={link.id} {...link} />
                ))}
            </div>
        </div>
    )
}
