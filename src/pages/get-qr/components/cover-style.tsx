import { useRef } from "react"
import { Text } from "../../../components"
import { resolveAssetUrl } from "../../../helpers"
import { LinkRow, StoreData, useLinksAppear } from "./link-row"

export const CoverStyle = ({data}: {data: StoreData}) => {
    const rootRef = useRef<HTMLDivElement>(null)
    useLinksAppear(rootRef)

    return (
        <div ref={rootRef} className="get-qr-card get-qr-card-cover">
            {data.image ? (
                <div className="get-qr-cover">
                    <img className="get-qr-cover-image" src={resolveAssetUrl(data.image)} alt={data.title} />
                    <div className="get-qr-cover-text">
                        {data.title && <Text size="l" color="white">{data.title}</Text>}
                        {data.subtitle && <Text size="s" color="lightGray">{data.subtitle}</Text>}
                    </div>
                </div>
            ) : (
                <div className="get-qr-cover-text get-qr-cover-text-plain">
                    {data.title && <Text size="l" color="white">{data.title}</Text>}
                    {data.subtitle && <Text size="s" color="lightGray">{data.subtitle}</Text>}
                </div>
            )}
            <div className="get-qr-links">
                {data.links.map((link) => (
                    <LinkRow key={link.id} {...link} />
                ))}
            </div>
        </div>
    )
}
