import { Text } from "../../../components"
import { CrmRequest, usePagedList } from "../api"
import { ListStatus, Pager } from "../components"

interface CrmClient {
    id: number;
    mail: string | null;
    login: string;
}

export const ClientsTab = ({request}: {request: CrmRequest}) => {
    const {items, loading, error, offset, setOffset, hasNext} = usePagedList<CrmClient>(request, '/crm/get-clients', 'clients')

    return (
        <div className="crm-list">
            <ListStatus loading={loading} error={error} empty={items.length === 0} emptyText="Клиентов нет" />

            {!loading && items.map((client) => (
                <div className="link-row admin-link-row" key={client.id}>
                    <div className="admin-link-info">
                        <Text size="m" color="white">{client.login}</Text>
                        <span className="admin-link-metric">{`#${client.id} · ${client.mail || 'почта не указана'}`}</span>
                    </div>
                </div>
            ))}

            <Pager offset={offset} hasNext={hasNext} loading={loading} onChange={setOffset} />
        </div>
    )
}
