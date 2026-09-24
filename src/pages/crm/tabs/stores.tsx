import { Text } from "../../../components"
import { resolveAssetUrl } from "../../../helpers"
import { CrmRequest, usePagedList } from "../api"
import { ListStatus, Pager } from "../components"

interface CrmStore {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    client_id: number | null;
    isMain: boolean;
}

export const StoresTab = ({request}: {request: CrmRequest}) => {
    const {items, loading, error, offset, setOffset, hasNext} = usePagedList<CrmStore>(request, '/crm/get-stores', 'stores')

    return (
        <div className="crm-list">
            <ListStatus loading={loading} error={error} empty={items.length === 0} emptyText="Страниц нет" />

            {!loading && items.map((store) => (
                <div className="link-row admin-link-row" key={store.id}>
                    {store.image
                        ? <img className="admin-template-thumb" src={resolveAssetUrl(store.image)} alt="" />
                        : <span className="admin-template-thumb crm-thumb-empty" />}
                    <div className="admin-link-info">
                        <Text size="m" color="white">{store.title || 'Без названия'}</Text>
                        <span className="admin-link-metric">
                            {`#${store.id} · клиент ${store.client_id ?? '—'}${store.subtitle ? ` · ${store.subtitle}` : ''}`}
                        </span>
                        {store.isMain && <span className="admin-template-badge">Основная</span>}
                    </div>
                    <button
                        type="button"
                        className="admin-edit-btn"
                        onClick={() => window.open(`${window.location.origin}/${store.id}`, '_blank', 'noopener,noreferrer')}
                    >
                        <Text size="xs" color="lightGray">Открыть</Text>
                    </button>
                </div>
            ))}

            <Pager offset={offset} hasNext={hasNext} loading={loading} onChange={setOffset} />
        </div>
    )
}
