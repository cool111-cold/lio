export const API_BASE_URL = 'http://localhost:8000'

/* ================================================================== */
/*  Типы                                                               */
/* ================================================================== */

/** Строка рекомендации меню (`/get-menu-recomendation`). */
export interface MenuRow {
    id: number;
    name: string;
    url: string;
    image_url: string;
    price: number;
}

export interface MenuRecomendationResult {
    menus: MenuRow[];
    offset: number;
    limit: number;
    count: number;
}

/** Тело запроса `RecomendationFilter`. */
export interface RecomendationFilter {
    ingredients?: string[] | null;
    baned_ingredients?: string[] | null;
    have_ingredients?: number[] | null;
    price_from?: number | null;
    price_to?: number | null;
    tags?: number[] | null;
    breadcrumbs?: number[] | null;
}

export interface RecipeItem {
    id: number;
    name: string;
    amount: number;
    unit: string;
}

export interface NamedRow {
    id: number;
    name: string;
}

/** Полная карточка меню (`/get-menu-by-id`). */
export interface MenuDetails {
    name: string;
    url: string;
    price: number;
    image_url: string;
    recipe: RecipeItem[];
    tags: (NamedRow | null)[];
    breadcrumbs: (NamedRow | null)[];
}

/** Ингредиент из `/get-ingredient`. */
export interface Ingredient {
    id: number;
    price: number;
    name: string;
}

/** Ингредиент из списка `/ingredients` (модель БД). */
export interface IngredientRow {
    id: number;
    name: string;
    price: number;
}

export interface IngredientListResult {
    ingredients: IngredientRow[];
    offset: number;
    limit: number;
    count: number;
}

export interface IngredientUpdate {
    name: string;
    price: number;
}

/* ================================================================== */
/*  transport                                                          */
/* ================================================================== */

const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, init)
    const raw = await res.text()

    if (!res.ok) {
        let detail = raw
        try {
            const parsed = JSON.parse(raw)
            if (typeof parsed?.detail === 'string') detail = parsed.detail
            else if (Array.isArray(parsed?.detail)) detail = JSON.stringify(parsed.detail)
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

const qs = (params: Record<string, string | number | undefined | null>) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.append(key, String(value))
    })
    const str = search.toString()
    return str ? `?${str}` : ''
}

/* ================================================================== */
/*  endpoints                                                          */
/* ================================================================== */

/** `GET /` — проверка живости бэка. */
export const getRoot = () => request<Record<string, string>>('/')

/** `POST /get-menu-recomendation` — рекомендации меню с фильтром и пагинацией. */
export const getMenuRecomendation = (
    filter: RecomendationFilter = {},
    offset = 0,
    limit = 10,
) => request<MenuRecomendationResult>(`/get-menu-recomendation${qs({offset, limit})}`, jsonInit(filter))

/** `GET /get-menu-by-id` — полная карточка меню (рецепт, теги, хлебные крошки). */
export const getMenuById = (menuId: number) =>
    request<MenuDetails>(`/get-menu-by-id${qs({menu_id: menuId})}`)

/** `POST /update-menu-image` — сменить картинку меню. */
export const updateMenuImage = (menuId: number, imageUrl: string) =>
    request<{image_url: string; message: string}>(
        `/update-menu-image${qs({menu_id: menuId, image_url: imageUrl})}`,
        {method: 'POST'},
    )

/** `GET /add-new-menu` — добавить меню по индексу источника. */
export const addNewMenu = (idx: number) =>
    request<{message: string}>(`/add-new-menu${qs({idx})}`)

/** `GET /ingredients` — постраничный список ингредиентов. */
export const getIngredients = (offset = 0, limit = 10) =>
    request<IngredientListResult>(`/ingredients${qs({offset, limit})}`)

/** `GET /search-ingredients` — поиск ингредиентов по подстроке. */
export const searchIngredients = (query: string, offset = 0, limit = 10) =>
    request<IngredientListResult>(`/search-ingredients${qs({query, offset, limit})}`)

/** `GET /get-ingredient` — один ингредиент (id, name, price). */
export const getIngredient = (ingredientId: number) =>
    request<Ingredient>(`/get-ingredient${qs({ingredient_id: ingredientId})}`)

/** `POST /update-ingredient` — изменить имя/цену ингредиента (цена каскадит в меню). */
export const updateIngredient = (ingredientId: number, payload: IngredientUpdate) =>
    request<{message: string; ingredient: IngredientRow}>(
        // на бэке query-параметр назван `ingridient_id`
        `/update-ingredient${qs({ingridient_id: ingredientId})}`,
        jsonInit(payload),
    )
