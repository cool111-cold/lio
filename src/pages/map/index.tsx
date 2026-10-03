import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, AttributionControl, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { PageComponent, Text } from "../../components"
import { MapPlace, LatLng, PlacesSheet } from './components/places-sheet'
import './style.css'

// Центр города (Барнаул)
// const CITY_CENTER: [number, number] = [53.346882, 83.777334]
const PLACE_ZOOM = 15

// Пока без бэка — стоковые места
const STOCK_PLACES: MapPlace[] = [
    {storeId: 1, title: 'Кофейня «Зерно»', subtitle: 'Кофе, десерты и завтраки весь день', lat: 53.349294, lng: 83.740734},
    {storeId: 2, title: 'Барбершоп «Лезвие»', subtitle: 'Стрижки и бритьё без записи', lat: 53.341250, lng: 83.781420},
    {storeId: 3, title: 'Цветочная «Пион»', subtitle: 'Букеты и доставка по городу', lat: 53.356810, lng: 83.769530},
]

const placeIcon = L.divIcon({
    className: 'map-place-icon',
    html: '<span class="map-place-dot"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
})

// Видимая область карты — позже будем запрашивать с бэка точки только в этих границах
const logViewport = (map: L.Map) => {
    const center = map.getCenter()
    const bounds = map.getBounds()
    console.log('[map] видимая область', {
        center: {lat: center.lat, lng: center.lng},
        zoom: map.getZoom(),
        bounds: {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
        },
    })
}

const ViewportLogger = () => {
    const map = useMap()
    // moveend срабатывает и после перетаскивания, и после зума
    useMapEvents({moveend: () => logViewport(map)})
    useEffect(() => { logViewport(map) }, [map])
    return null
}

export const MapPage = () => {
    const [listOpen, setListOpen] = useState(false)
    const [userLocation, setUserLocation] = useState<LatLng | null>(null)
    const mapRef = useRef<L.Map>(null)
    const markerRefs = useRef<Record<number, L.Marker | null>>({})
    const [CITY_CENTER, SET_SITY_CENTER] = useState<[number, number]>([55.7522, 37.6156]);

    // Координаты пользователя — позже будем отправлять на бэк, чтобы получить ближайшие места
    useEffect(() => {
        if (!navigator.geolocation) {
            console.warn('[map] геолокация не поддерживается браузером')
            return
        }
        navigator.geolocation.getCurrentPosition(
            ({coords}) => {
                const location = {lat: coords.latitude, lng: coords.longitude}
                console.log('[map] координаты пользователя', {...location, accuracy: coords.accuracy})
                setUserLocation(location)
                SET_SITY_CENTER([location.lat, location.lng])
                const map = mapRef.current
                if (!map) return
                map.flyTo([location.lat, location.lng], undefined, {animate: false})
            },
            (error) => console.warn('[map] не удалось получить координаты:', error.message),
            {enableHighAccuracy: true, timeout: 10000},
        )
    }, [])

    const showPlace = (place: MapPlace) => {
        const map = mapRef.current
        if (!map) return
        setListOpen(false)
        map.flyTo([place.lat, place.lng], PLACE_ZOOM, {duration: 0.8})
        map.once('moveend', () => markerRefs.current[place.storeId]?.openPopup())
    }

    return (
        <PageComponent center={false}>
            <div className="map-page">
                <MapContainer ref={mapRef} className="map-container" center={CITY_CENTER} zoom={12} maxZoom={16} zoomControl={false} attributionControl={false}>
                    {/* Esri Dark Gray Canvas: подложка и подписи улиц без чужих POI */}
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                        attribution='Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
                        maxZoom={16}
                    />
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                        maxZoom={16}
                    />
                    <AttributionControl position="bottomright" prefix={false} />
                    <ViewportLogger />
                    {STOCK_PLACES.map((place) => (
                        <Marker
                            key={place.storeId}
                            ref={(marker) => { markerRefs.current[place.storeId] = marker }}
                            position={[place.lat, place.lng]}
                            icon={placeIcon}
                        >
                            <Popup className="map-popup" closeButton={false}>
                                <div className="map-popup-body">
                                    <Text size="m" color="white">{place.title}</Text>
                                    <Text size="xs" color="lightGray">{place.subtitle}</Text>
                                    <button
                                        type="button"
                                        className="map-popup-button"
                                        onClick={() => { window.location.href = `/${place.storeId}` }}
                                    >
                                        Открыть
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                <div className="map-overlay">
                    <button type="button" className="map-list-toggle" onClick={() => setListOpen(true)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                            <path d="M2 4h12M2 8h12M2 12h12" />
                        </svg>
                        <span>Ближайшие места · {STOCK_PLACES.length}</span>
                    </button>
                </div>

                <PlacesSheet
                    open={listOpen}
                    places={STOCK_PLACES}
                    userLocation={userLocation}
                    onClose={() => setListOpen(false)}
                    onShowOnMap={showPlace}
                />
            </div>
        </PageComponent>
    )
}
