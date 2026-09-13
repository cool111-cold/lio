import {
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    API_BASE_URL,
    Ingredient,
    IngredientListResult,
    MenuDetails,
    MenuRecomendationResult,
    MenuRow,
    RecipeItem,
    RecomendationFilter,
    addNewMenu,
    getIngredient,
    getIngredients,
    getMenuById,
    getMenuRecomendation,
    getRoot,
    searchIngredients,
    updateIngredient,
    updateMenuImage,
} from './api'
import './style.css'

/* ================================================================== */
/*  helpers                                                            */
/* ================================================================== */

const money = new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 2})
const fmt = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : `${money.format(value)} ₽`

const errText = (error: unknown) =>
    error instanceof Error ? error.message : 'Ошибка сети'

/** "мука, соль, вода" -> ["мука", "соль", "вода"] */
const splitList = (raw: string): string[] =>
    raw.split(',').map((s) => s.trim()).filter(Boolean)

/** "1, 2, 3" -> [1, 2, 3] */
const splitIds = (raw: string): number[] =>
    splitList(raw).map(Number).filter((n) => Number.isFinite(n))

const Field = ({
    label,
    children,
}: {
    label: string
    children: ReactNode
}) => (
    <label className="tea-field">
        <span>{label}</span>
        {children}
    </label>
)

const Alert = ({kind, children}: {kind: 'err' | 'ok'; children: ReactNode}) => (
    <div className={`tea-alert tea-alert--${kind}`}>{children}</div>
)

const PLACEHOLDER_IMG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23f0eae3"/><text x="60" y="65" font-size="12" fill="%239a9aa6" text-anchor="middle" font-family="sans-serif">нет фото</text></svg>',
    )

const Img = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        alt=""
        {...props}
        src={props.src || PLACEHOLDER_IMG}
        onError={(event) => {
            event.currentTarget.src = PLACEHOLDER_IMG
        }}
    />
)

/* ================================================================== */
/*  Рецептурный ингредиент (пробивается по /get-ingredient)            */
/* ================================================================== */

const RecipeIngredientRow = ({
    item,
    onChanged,
}: {
    item: RecipeItem
    onChanged: () => void
}) => {
    const [data, setData] = useState<Ingredient | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [editing, setEditing] = useState(false)
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [saving, setSaving] = useState(false)

    const load = useCallback(() => {
        setLoading(true)
        setError(null)
        getIngredient(item.id)
            .then((res) => {
                setData(res)
                setName(res.name)
                setPrice(String(res.price))
            })
            .catch((err) => setError(errText(err)))
            .finally(() => setLoading(false))
    }, [item.id])

    useEffect(load, [load])

    const save = () => {
        setSaving(true)
        setError(null)
        updateIngredient(item.id, {name: name.trim(), price: Number(price) || 0})
            .then(() => {
                setEditing(false)
                load()
                onChanged()
            })
            .catch((err) => setError(errText(err)))
            .finally(() => setSaving(false))
    }

    return (
        <tr>
            <td>#{item.id}</td>
            <td>
                {editing ? (
                    <input
                        className="tea-input"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                ) : (
                    data?.name ?? item.name
                )}
            </td>
            <td>
                {item.amount} {item.unit}
            </td>
            <td>
                {loading ? (
                    <span className="tea-muted">…</span>
                ) : editing ? (
                    <input
                        className="tea-input tea-input--sm"
                        type="number"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                    />
                ) : (
                    fmt(data?.price)
                )}
            </td>
            <td style={{textAlign: 'right'}}>
                {editing ? (
                    <span className="tea-inline-form" style={{justifyContent: 'flex-end'}}>
                        <button
                            className="tea-btn tea-btn--sm"
                            onClick={save}
                            disabled={saving}
                        >
                            {saving ? 'Сохраняю…' : 'Сохранить'}
                        </button>
                        <button
                            className="tea-btn tea-btn--ghost tea-btn--sm"
                            onClick={() => {
                                setEditing(false)
                                if (data) {
                                    setName(data.name)
                                    setPrice(String(data.price))
                                }
                            }}
                        >
                            Отмена
                        </button>
                    </span>
                ) : (
                    <button
                        className="tea-btn tea-btn--ghost tea-btn--sm"
                        onClick={() => setEditing(true)}
                        disabled={loading || !!error}
                    >
                        Редактировать
                    </button>
                )}
                {error && (
                    <div className="tea-muted" style={{color: 'var(--danger)'}}>
                        {error}
                    </div>
                )}
            </td>
        </tr>
    )
}

/* ================================================================== */
/*  Карточка меню                                                      */
/* ================================================================== */

const MenuCard = ({menu, onPriceMaybeChanged}: {menu: MenuRow; onPriceMaybeChanged: () => void}) => {
    const [open, setOpen] = useState(false)
    const [details, setDetails] = useState<MenuDetails | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [imageUrl, setImageUrl] = useState('')
    const [savingImg, setSavingImg] = useState(false)
    const [imgMsg, setImgMsg] = useState<string | null>(null)

    const load = useCallback(() => {
        setLoading(true)
        setError(null)
        getMenuById(menu.id)
            .then((res) => {
                setDetails(res)
                setImageUrl(res.image_url || '')
            })
            .catch((err) => setError(errText(err)))
            .finally(() => setLoading(false))
    }, [menu.id])

    const toggle = () => {
        const next = !open
        setOpen(next)
        if (next && !details && !loading) load()
    }

    const saveImage = () => {
        setSavingImg(true)
        setImgMsg(null)
        setError(null)
        updateMenuImage(menu.id, imageUrl.trim())
            .then((res) => {
                setImgMsg(res.message || 'Готово')
                setDetails((prev) => (prev ? {...prev, image_url: res.image_url} : prev))
            })
            .catch((err) => setError(errText(err)))
            .finally(() => setSavingImg(false))
    }

    const shownImage = details?.image_url ?? menu.image_url

    return (
        <div className="tea-menu">
            <div className="tea-menu-bar">
                <Img className="tea-menu-thumb" src={shownImage} />
                <div className="tea-menu-main">
                    <div className="tea-menu-name">{menu.name}</div>
                    <div className="tea-menu-sub">
                        #{menu.id}
                        {menu.url ? (
                            <>
                                {' · '}
                                <a href={menu.url} target="_blank" rel="noreferrer">
                                    источник
                                </a>
                            </>
                        ) : null}
                    </div>
                </div>
                <div className="tea-menu-price">{fmt(details?.price ?? menu.price)}</div>
                <button className="tea-btn tea-btn--ghost tea-btn--sm" onClick={toggle}>
                    {open ? 'Свернуть' : 'Подробнее'}
                </button>
            </div>

            {open && (
                <div className="tea-menu-body">
                    <div>
                        <Img className="tea-menu-photo" src={shownImage} />
                        <div className="tea-section-label" style={{marginTop: 14}}>
                            Сменить изображение
                        </div>
                        <div className="tea-inline-form">
                            <input
                                className="tea-input"
                                style={{flex: 1, minWidth: 160}}
                                placeholder="https://…"
                                value={imageUrl}
                                onChange={(event) => setImageUrl(event.target.value)}
                            />
                            <button
                                className="tea-btn tea-btn--sm"
                                onClick={saveImage}
                                disabled={savingImg}
                            >
                                {savingImg ? '…' : 'Обновить'}
                            </button>
                        </div>
                        {imgMsg && (
                            <div className="tea-alert tea-alert--ok" style={{marginTop: 8}}>
                                {imgMsg}
                            </div>
                        )}
                    </div>

                    <div>
                        {loading && (
                            <div className="tea-muted">
                                <span className="tea-spin" />
                                Загружаю карточку…
                            </div>
                        )}
                        {error && <Alert kind="err">{error}</Alert>}

                        {details && (
                            <>
                                <div className="tea-section-label">Ингредиенты</div>
                                {details.recipe.length === 0 ? (
                                    <div className="tea-muted">Рецепт пуст</div>
                                ) : (
                                    <table className="tea-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Название</th>
                                                <th>Кол-во</th>
                                                <th>Цена</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details.recipe.map((item) => (
                                                <RecipeIngredientRow
                                                    key={item.id}
                                                    item={item}
                                                    onChanged={() => {
                                                        load()
                                                        onPriceMaybeChanged()
                                                    }}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {details.tags.filter(Boolean).length > 0 && (
                                    <>
                                        <div className="tea-section-label">Теги</div>
                                        <div className="tea-chips">
                                            {details.tags.filter(Boolean).map((tag) => (
                                                <span className="tea-chip" key={tag!.id}>
                                                    {tag!.name}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {details.breadcrumbs.filter(Boolean).length > 0 && (
                                    <>
                                        <div className="tea-section-label">Хлебные крошки</div>
                                        <div className="tea-chips">
                                            {details.breadcrumbs.filter(Boolean).map((bc) => (
                                                <span className="tea-chip" key={bc!.id}>
                                                    {bc!.name}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ================================================================== */
/*  Раздел «Рекомендации»                                              */
/* ================================================================== */

interface FilterForm {
    ingredients: string
    baned_ingredients: string
    have_ingredients: string
    price_from: string
    price_to: string
    tags: string
    breadcrumbs: string
}

const emptyFilter: FilterForm = {
    ingredients: '',
    baned_ingredients: '',
    have_ingredients: '',
    price_from: '',
    price_to: '',
    tags: '',
    breadcrumbs: '',
}

const RecomendationsView = () => {
    const [form, setForm] = useState<FilterForm>(emptyFilter)
    const [offset, setOffset] = useState(0)
    const [limit, setLimit] = useState(10)

    const [result, setResult] = useState<MenuRecomendationResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    const filterPayload = useMemo<RecomendationFilter>(
        () => ({
            ingredients: splitList(form.ingredients),
            baned_ingredients: splitList(form.baned_ingredients),
            have_ingredients: splitIds(form.have_ingredients),
            price_from: form.price_from === '' ? null : Number(form.price_from),
            price_to: form.price_to === '' ? null : Number(form.price_to),
            tags: splitIds(form.tags),
            breadcrumbs: splitIds(form.breadcrumbs),
        }),
        [form],
    )

    const set = (key: keyof FilterForm) => (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({...prev, [key]: event.target.value}))

    // грузим при смене offset/limit/reloadKey; фильтр применяется по кнопке (через reloadKey)
    useEffect(() => {
        let alive = true
        setLoading(true)
        setError(null)
        getMenuRecomendation(filterPayload, offset, limit)
            .then((res) => {
                if (alive) setResult(res)
            })
            .catch((err) => {
                if (alive) setError(errText(err))
            })
            .finally(() => {
                if (alive) setLoading(false)
            })
        return () => {
            alive = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offset, limit, reloadKey])

    const apply = () => {
        setOffset(0)
        setReloadKey((k) => k + 1)
    }

    const total = result?.count ?? 0
    const pageFrom = total === 0 ? 0 : offset + 1
    const pageTo = Math.min(offset + limit, total)

    return (
        <>
            <div className="tea-card">
                <div className="tea-section-label">Фильтр рекомендаций</div>
                <div className="tea-row">
                    <Field label="Ингредиенты (через запятую)">
                        <input className="tea-input" value={form.ingredients} onChange={set('ingredients')} placeholder="курица, рис" />
                    </Field>
                    <Field label="Исключить ингредиенты">
                        <input className="tea-input" value={form.baned_ingredients} onChange={set('baned_ingredients')} placeholder="арахис" />
                    </Field>
                    <Field label="Есть ингредиенты (ID, скидка)">
                        <input className="tea-input" value={form.have_ingredients} onChange={set('have_ingredients')} placeholder="12, 40" />
                    </Field>
                </div>
                <div className="tea-row" style={{marginTop: 12}}>
                    <Field label="Цена от">
                        <input className="tea-input tea-input--sm" type="number" value={form.price_from} onChange={set('price_from')} />
                    </Field>
                    <Field label="Цена до">
                        <input className="tea-input tea-input--sm" type="number" value={form.price_to} onChange={set('price_to')} />
                    </Field>
                    <Field label="Теги (ID)">
                        <input className="tea-input" value={form.tags} onChange={set('tags')} placeholder="1, 5" />
                    </Field>
                    <Field label="Крошки (ID)">
                        <input className="tea-input" value={form.breadcrumbs} onChange={set('breadcrumbs')} placeholder="3" />
                    </Field>
                </div>
                <div className="tea-row" style={{marginTop: 14}}>
                    <Field label="Offset">
                        <input
                            className="tea-input tea-input--sm"
                            type="number"
                            min={0}
                            value={offset}
                            onChange={(event) => setOffset(Math.max(0, Number(event.target.value) || 0))}
                        />
                    </Field>
                    <Field label="Limit">
                        <input
                            className="tea-input tea-input--sm"
                            type="number"
                            min={1}
                            value={limit}
                            onChange={(event) => setLimit(Math.max(1, Number(event.target.value) || 1))}
                        />
                    </Field>
                    <button className="tea-btn" onClick={apply}>
                        Применить фильтр
                    </button>
                    <button
                        className="tea-btn tea-btn--ghost"
                        onClick={() => {
                            setForm(emptyFilter)
                            setOffset(0)
                            setReloadKey((k) => k + 1)
                        }}
                    >
                        Сбросить
                    </button>
                </div>
                {error && <Alert kind="err">{error}</Alert>}
            </div>

            <div className="tea-card">
                <div className="tea-section-label">
                    Рекомендации {total > 0 && `· ${pageFrom}–${pageTo} из ${total}`}
                </div>

                {loading && (
                    <div className="tea-muted">
                        <span className="tea-spin" />
                        Загружаю…
                    </div>
                )}

                {!loading && result && result.menus.length === 0 && (
                    <div className="tea-muted">Ничего не найдено</div>
                )}

                {!loading &&
                    result?.menus.map((menu) => (
                        <MenuCard
                            key={menu.id}
                            menu={menu}
                            onPriceMaybeChanged={() => setReloadKey((k) => k + 1)}
                        />
                    ))}

                <div className="tea-pager">
                    <button
                        className="tea-btn tea-btn--ghost tea-btn--sm"
                        disabled={offset <= 0 || loading}
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                    >
                        ← Назад
                    </button>
                    <span>
                        offset {offset}
                    </span>
                    <button
                        className="tea-btn tea-btn--ghost tea-btn--sm"
                        disabled={loading || offset + limit >= total}
                        onClick={() => setOffset(offset + limit)}
                    >
                        Вперёд →
                    </button>
                </div>
            </div>
        </>
    )
}

/* ================================================================== */
/*  Раздел «Ингредиенты»                                               */
/* ================================================================== */

const IngredientEditRow = ({
    row,
    onSaved,
}: {
    row: {id: number; name: string; price: number}
    onSaved: () => void
}) => {
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(row.name)
    const [price, setPrice] = useState(String(row.price))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setName(row.name)
        setPrice(String(row.price))
    }, [row.name, row.price])

    const save = () => {
        setSaving(true)
        setError(null)
        updateIngredient(row.id, {name: name.trim(), price: Number(price) || 0})
            .then(() => {
                setEditing(false)
                onSaved()
            })
            .catch((err) => setError(errText(err)))
            .finally(() => setSaving(false))
    }

    return (
        <tr>
            <td>#{row.id}</td>
            <td>
                {editing ? (
                    <input className="tea-input" value={name} onChange={(event) => setName(event.target.value)} />
                ) : (
                    row.name
                )}
            </td>
            <td>
                {editing ? (
                    <input
                        className="tea-input tea-input--sm"
                        type="number"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                    />
                ) : (
                    fmt(row.price)
                )}
            </td>
            <td style={{textAlign: 'right'}}>
                {editing ? (
                    <span className="tea-inline-form" style={{justifyContent: 'flex-end'}}>
                        <button className="tea-btn tea-btn--sm" onClick={save} disabled={saving}>
                            {saving ? '…' : 'Сохранить'}
                        </button>
                        <button
                            className="tea-btn tea-btn--ghost tea-btn--sm"
                            onClick={() => {
                                setEditing(false)
                                setName(row.name)
                                setPrice(String(row.price))
                            }}
                        >
                            Отмена
                        </button>
                    </span>
                ) : (
                    <button className="tea-btn tea-btn--ghost tea-btn--sm" onClick={() => setEditing(true)}>
                        Редактировать
                    </button>
                )}
                {error && (
                    <div className="tea-muted" style={{color: 'var(--danger)'}}>
                        {error}
                    </div>
                )}
            </td>
        </tr>
    )
}

const IngredientsView = () => {
    const [query, setQuery] = useState('')
    const [activeQuery, setActiveQuery] = useState('')
    const [offset, setOffset] = useState(0)
    const [limit, setLimit] = useState(10)
    const [data, setData] = useState<IngredientListResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let alive = true
        setLoading(true)
        setError(null)
        const promise = activeQuery
            ? searchIngredients(activeQuery, offset, limit)
            : getIngredients(offset, limit)
        promise
            .then((res) => alive && setData(res))
            .catch((err) => alive && setError(errText(err)))
            .finally(() => alive && setLoading(false))
        return () => {
            alive = false
        }
    }, [activeQuery, offset, limit, reloadKey])

    const total = data?.count ?? 0

    return (
        <div className="tea-card">
            <div className="tea-section-label">Справочник ингредиентов</div>
            <div className="tea-row">
                <Field label="Поиск по названию">
                    <input
                        className="tea-input"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                setOffset(0)
                                setActiveQuery(query.trim())
                            }
                        }}
                        placeholder="сахар"
                    />
                </Field>
                <button
                    className="tea-btn"
                    onClick={() => {
                        setOffset(0)
                        setActiveQuery(query.trim())
                    }}
                >
                    Искать
                </button>
                {activeQuery && (
                    <button
                        className="tea-btn tea-btn--ghost"
                        onClick={() => {
                            setQuery('')
                            setActiveQuery('')
                            setOffset(0)
                        }}
                    >
                        Показать все
                    </button>
                )}
                <Field label="Limit">
                    <input
                        className="tea-input tea-input--sm"
                        type="number"
                        min={1}
                        value={limit}
                        onChange={(event) => setLimit(Math.max(1, Number(event.target.value) || 1))}
                    />
                </Field>
            </div>

            {error && <Alert kind="err">{error}</Alert>}

            {loading ? (
                <div className="tea-muted" style={{marginTop: 14}}>
                    <span className="tea-spin" />
                    Загружаю…
                </div>
            ) : (
                <table className="tea-table" style={{marginTop: 14}}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Название</th>
                            <th>Цена</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {data?.ingredients.map((row) => (
                            <IngredientEditRow
                                key={row.id}
                                row={row}
                                onSaved={() => setReloadKey((k) => k + 1)}
                            />
                        ))}
                        {data && data.ingredients.length === 0 && (
                            <tr>
                                <td colSpan={4} className="tea-muted">
                                    Пусто
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            <div className="tea-pager">
                <button
                    className="tea-btn tea-btn--ghost tea-btn--sm"
                    disabled={offset <= 0 || loading}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                    ← Назад
                </button>
                <span>
                    {total > 0
                        ? `${offset + 1}–${Math.min(offset + limit, total)} из ${total}`
                        : `offset ${offset}`}
                </span>
                <button
                    className="tea-btn tea-btn--ghost tea-btn--sm"
                    disabled={loading || offset + limit >= total}
                    onClick={() => setOffset(offset + limit)}
                >
                    Вперёд →
                </button>
            </div>
        </div>
    )
}

/* ================================================================== */
/*  Раздел «Добавить меню»                                             */
/* ================================================================== */

const AddMenuView = () => {
    const [idx, setIdx] = useState('')
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const submit = () => {
        setBusy(true)
        setMsg(null)
        setError(null)
        addNewMenu(Number(idx) || 0)
            .then((res) => setMsg(res.message || 'Готово'))
            .catch((err) => setError(errText(err)))
            .finally(() => setBusy(false))
    }

    return (
        <div className="tea-card">
            <div className="tea-section-label">Добавить меню из источника</div>
            <p className="tea-muted" style={{marginTop: 0}}>
                Бэк вызывает <code>add_to_db(0, idx)</code> — парсит позиции источника
                с индексами от 0 до <code>idx</code> и добавляет отсутствующие.
            </p>
            <div className="tea-inline-form">
                <input
                    className="tea-input tea-input--sm"
                    type="number"
                    min={1}
                    placeholder="idx"
                    value={idx}
                    onChange={(event) => setIdx(event.target.value)}
                />
                <button className="tea-btn" onClick={submit} disabled={busy || idx === ''}>
                    {busy ? 'Добавляю…' : 'Добавить'}
                </button>
            </div>
            {msg && <Alert kind="ok">{msg}</Alert>}
            {error && <Alert kind="err">{error}</Alert>}
        </div>
    )
}

/* ================================================================== */
/*  Раздел «Статус»                                                    */
/* ================================================================== */

const StatusView = () => {
    const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle')
    const [payload, setPayload] = useState<string>('')

    const ping = useCallback(() => {
        setState('idle')
        getRoot()
            .then((res) => {
                setState('ok')
                setPayload(JSON.stringify(res))
            })
            .catch((err) => {
                setState('err')
                setPayload(errText(err))
            })
    }, [])

    useEffect(ping, [ping])

    return (
        <div className="tea-card">
            <div className="tea-section-label">Соединение с API</div>
            <p className="tea-muted" style={{marginTop: 0}}>
                <code>{API_BASE_URL}</code>
            </p>
            {state === 'ok' && <Alert kind="ok">Онлайн · {payload}</Alert>}
            {state === 'err' && <Alert kind="err">Недоступен · {payload}</Alert>}
            {state === 'idle' && (
                <div className="tea-muted">
                    <span className="tea-spin" />
                    Проверяю…
                </div>
            )}
            <div style={{marginTop: 12}}>
                <button className="tea-btn tea-btn--ghost tea-btn--sm" onClick={ping}>
                    Проверить снова
                </button>
            </div>
        </div>
    )
}

/* ================================================================== */
/*  Корневой компонент                                                 */
/* ================================================================== */

type Section = 'recomendations' | 'ingredients' | 'add' | 'status'

const NAV: {id: Section; label: string; icon: string}[] = [
    {id: 'recomendations', label: 'Рекомендации', icon: '🍽'},
    {id: 'ingredients', label: 'Ингредиенты', icon: '🧂'},
    {id: 'add', label: 'Добавить меню', icon: '＋'},
    {id: 'status', label: 'Статус API', icon: '📡'},
]

const HEAD: Record<Section, {title: string; subtitle: string}> = {
    recomendations: {
        title: 'Рекомендации меню',
        subtitle: 'POST /get-menu-recomendation · фильтр, offset/limit, разбор карточки и рецептуры',
    },
    ingredients: {
        title: 'Ингредиенты',
        subtitle: 'GET /ingredients · /search-ingredients · POST /update-ingredient',
    },
    add: {title: 'Добавление меню', subtitle: 'GET /add-new-menu'},
    status: {title: 'Статус', subtitle: 'GET /'},
}

export const Teander = () => {
    const [section, setSection] = useState<Section>('recomendations')
    const head = HEAD[section]

    return (
        <div className="tea-app">
            <aside className="tea-side">
                <div className="tea-brand">
                    <span className="tea-brand-mark">T</span>
                    Teander CRM
                </div>
                {NAV.map((item) => (
                    <button
                        key={item.id}
                        className={`tea-nav-item${section === item.id ? ' is-active' : ''}`}
                        onClick={() => setSection(item.id)}
                    >
                        <span aria-hidden>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
                <div className="tea-side-foot">menuv3 · {API_BASE_URL}</div>
            </aside>

            <main className="tea-main">
                <div className="tea-head">
                    <div>
                        <h1>{head.title}</h1>
                        <p>{head.subtitle}</p>
                    </div>
                </div>

                {section === 'recomendations' && <RecomendationsView />}
                {section === 'ingredients' && <IngredientsView />}
                {section === 'add' && <AddMenuView />}
                {section === 'status' && <StatusView />}
            </main>
        </div>
    )
}

export default Teander
