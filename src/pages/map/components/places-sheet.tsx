import { PointerEvent, useRef, useState } from "react"
import { Text } from "../../../components"
import { resolveAssetUrl } from "../../../helpers"

export interface MapPlace {
    storeId: number;
    title: string;
    subtitle: string;
    image?: string;
    lat: number;
    lng: number;
}

export type LatLng = {lat: number; lng: number}

// Насколько нужно стянуть шторку вниз, чтобы она закрылась
const CLOSE_DRAG_THRESHOLD = 80

// Расстояние по прямой (формула гаверсинусов), в метрах
export const distanceMeters = (a: LatLng, b: LatLng): number => {
    const R = 6371000
    const toRad = (deg: number) => deg * Math.PI / 180
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
}

export const formatDistance = (meters: number): string =>
    meters < 1000
        ? `${Math.round(meters / 10) * 10} м`
        : `${(meters / 1000).toFixed(1).replace('.', ',')} км`

const PlaceAvatar = ({title, image}: Pick<MapPlace, 'title' | 'image'>) => (
    <div className="places-sheet-avatar">
        {image
            ? <img src={resolveAssetUrl(image)} alt={title} />
            : <span>{title.match(/[a-zа-яё0-9]/i)?.[0].toUpperCase()}</span>}
    </div>
)

interface PlacesSheetProps {
    open: boolean;
    places: MapPlace[];
    userLocation: LatLng | null;
    onClose: () => void;
    onShowOnMap: (place: MapPlace) => void;
}

export const PlacesSheet = ({open, places, userLocation, onClose, onShowOnMap}: PlacesSheetProps) => {
    const [dragY, setDragY] = useState(0)
    const dragStart = useRef<number | null>(null)

    // Если знаем, где пользователь, — ближайшие места сверху
    const items = places
        .map((place) => ({place, distance: userLocation ? distanceMeters(userLocation, place) : null}))
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        dragStart.current = e.clientY
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (dragStart.current === null) return
        setDragY(Math.max(0, e.clientY - dragStart.current))
    }

    const handlePointerUp = () => {
        if (dragStart.current === null) return
        dragStart.current = null
        if (dragY > CLOSE_DRAG_THRESHOLD) onClose()
        setDragY(0)
    }

    return (
        <>
            <div className={`places-sheet-backdrop${open ? ' is-open' : ''}`} onClick={onClose} />
            <div
                className={`places-sheet${open ? ' is-open' : ''}${dragY ? ' is-dragging' : ''}`}
                style={dragY ? {transform: `translateY(${dragY}px)`} : undefined}
                aria-hidden={!open}
            >
                <div
                    className="places-sheet-header"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <span className="places-sheet-handle" />
                    <Text size="l" color="white">Ближайшие места</Text>
                    {/* <Text size="xs" color="lightGray">
                        {userLocation ? 'Сначала ближайшие' : `${places.length} на карте`}
                    </Text> */}
                </div>

                <div className="places-sheet-list">
                    {items.map(({place, distance}) => (
                        <div key={place.storeId} className="places-sheet-item">
                            <div className="places-sheet-item-info">
                                <PlaceAvatar title={place.title} image={place.image} />
                                <div className="places-sheet-item-text">
                                    <Text size="m" color="white">{place.title}</Text>
                                    <Text size="xs" color="lightGray">{place.subtitle}</Text>
                                </div>
                                {distance !== null && (
                                    <span className="places-sheet-distance">{formatDistance(distance)}</span>
                                )}
                            </div>
                            <div className="places-sheet-item-actions">
                                <button type="button" className="places-sheet-button" onClick={() => onShowOnMap(place)}>
                                    На карте
                                </button>
                                <button
                                    type="button"
                                    className="places-sheet-button is-primary"
                                    onClick={() => { window.location.href = `/${place.storeId}` }}
                                >
                                    Открыть
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
