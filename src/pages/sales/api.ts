export const API_BASE_URL = 'http://localhost:8000'

/** Один элемент массива `condition` / `product_id` — произвольный словарь. */
export type AnyDict = Record<string, unknown>

/** Тело запроса `Sale` (см. Pydantic-модель на бэке). */
export interface SalePayload {
    name: string;
    active: boolean;
    started_at: string; // ISO 8601
    ended_at: string;   // ISO 8601
    summary: boolean;
    code?: string | null;
    isProduct: boolean;
    priority: number;
    /** Проценты (0–100). Бэк сам делит на 100 при сохранении. */
    discount: number;
    condition: AnyDict[];
}

/** То, что возвращает `/get-sales` — `SaleDB`. discount тут уже дробью (0–1). */
export interface SaleRecord extends Omit<SalePayload, 'discount'> {
    id: number;
    discount: number;
}

export interface UserPayload {
    name: string;
    region: string;
    status: string;
}

export interface UserRecord extends UserPayload {
    id: number;
}

export interface ProductPayload {
    name: string;
    price: number;
    card_price: number;
    category: string;
}

export interface ProductRecord extends ProductPayload {
    id: number;
}

/** Тело запроса `SaleQuery` для `/get-price`. */
export interface PriceQuery {
    user_id: number;
    product_id: AnyDict[];
    promocode: string;
    partner_card: boolean;
    ball: number;
}

export interface PriceResult {
    products: AnyDict[];
    user_sales: unknown[];
    price: number;
}

const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, init)
    const raw = await res.text()

    if (!res.ok) {
        let detail = raw
        try {
            const parsed = JSON.parse(raw)
            detail = typeof parsed?.detail === 'string' ? parsed.detail : raw
        } catch {
            /* оставляем raw как есть */
        }
        throw new Error(detail || `${res.status} ${res.statusText}`)
    }

    return (raw ? JSON.parse(raw) : {}) as T
}

const jsonInit = (body: unknown, method = 'POST'): RequestInit => ({
    method,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
})

export const getSales = () =>
    request<{message: string; sale: SaleRecord[]}>('/get-sales')

export const createSale = (payload: SalePayload) =>
    request<{message: string; sale: number}>('/create-sale', jsonInit(payload))

// Требует правки бэка: `sale_id` должен быть query-параметром, а не `Form(...)`
//   async def update_sale(sale: Sale, sale_id: int, db: Session = Depends(get_db)):
// иначе FastAPI парсит тело как form-data и не может собрать модель `sale` из строки.
export const updateSale = (saleId: number, payload: SalePayload) =>
    request<{message: string}>(`/update-sale?sale_id=${encodeURIComponent(saleId)}`, jsonInit(payload))

export const deleteSale = (saleId: number) => {
    const body = new FormData()
    body.append('sale_id', String(saleId))
    return request<{message: string}>('/deleted-sale', {method: 'POST', body})
}

export const getUsers = () =>
    request<{users: UserRecord[]}>('/get-users')

export const createUser = (payload: UserPayload) =>
    request<{message: string}>('/create-user', jsonInit(payload))

// `user_id: int` без Form/Body — FastAPI трактует его как query-параметр.
export const deleteUser = (userId: number) =>
    request<{message: string}>(`/delete-user?user_id=${encodeURIComponent(userId)}`, {method: 'POST'})

export const getProducts = () =>
    request<{products: ProductRecord[]}>('/get-products')

export const createProduct = (payload: ProductPayload) =>
    request<{message: string}>('/create-product', jsonInit(payload))

export const deleteProduct = (productId: number) =>
    request<{message: string}>(`/delete-product?product_id=${encodeURIComponent(productId)}`, {method: 'POST'})

export const getPrice = (query: PriceQuery, paramDatetime?: string) => {
    const suffix = paramDatetime ? `?param_datetime=${encodeURIComponent(paramDatetime)}` : ''
    return request<PriceResult>(`/get-price${suffix}`, jsonInit(query))
}

/* ---- нагрузочные пробы (не бросают, меряют время) ------------------- */

export interface Probe {
    ok: boolean;
    status: number;
    ms: number;
    error?: string;
}

const timedFetch = async (path: string, init?: RequestInit): Promise<Probe> => {
    const start = performance.now()
    try {
        const res = await fetch(`${API_BASE_URL}${path}`, init)
        await res.text()
        return {ok: res.ok, status: res.status, ms: performance.now() - start}
    } catch (error) {
        return {
            ok: false,
            status: 0,
            ms: performance.now() - start,
            error: error instanceof Error ? error.message : 'network error',
        }
    }
}

export const probeGetPrice = (query: PriceQuery) => timedFetch('/get-price', jsonInit(query))

export const probeEndpoint = (path: string, init?: RequestInit) => timedFetch(path, init)
