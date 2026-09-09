import { ReactNode, SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { DictListEditor } from './components/DictListEditor'
import { Field, TextField, Toggle, Txt, isoToLocalInput, localInputToIso } from './components/controls'
import {
    IconActivity,
    IconBox,
    IconCalc,
    IconChevron,
    IconClose,
    IconDatabase,
    IconLayers,
    IconPencil,
    IconPlus,
    IconTag,
    IconTrash,
    IconUsers,
} from './components/icons'
import {
    AnyDict,
    PriceQuery,
    PriceResult,
    Probe,
    ProductPayload,
    ProductRecord,
    SalePayload,
    SaleRecord,
    UserPayload,
    UserRecord,
    createProduct,
    createSale,
    createUser,
    deleteProduct,
    deleteSale,
    deleteUser,
    getPrice,
    getProducts,
    getSales,
    getUsers,
    probeEndpoint,
    probeGetPrice,
    updateSale,
} from './api'
import './style.css'

type Section = 'sales' | 'users' | 'products' | 'calc' | 'tests' | 'seed'

const NAV: {id: Section; label: string; icon: ReactNode}[] = [
    {id: 'sales', label: 'Скидки', icon: <IconTag />},
    {id: 'users', label: 'Клиенты', icon: <IconUsers />},
    {id: 'products', label: 'Товары', icon: <IconBox />},
    {id: 'calc', label: 'Расчёт цены', icon: <IconCalc />},
    {id: 'tests', label: 'Тесты', icon: <IconActivity />},
    {id: 'seed', label: 'Наполнение', icon: <IconDatabase />},
]

/** Общий префикс имени для всех сгенерированных тестовых записей. */
const TEST_PREFIX = '[test]'
const isTestName = (name?: string) => (name ?? '').trim().toLowerCase().startsWith(TEST_PREFIX)

const numberFormat = new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 2})
const formatNumber = (value: number) => numberFormat.format(value)
const percentOf = (fraction: number) => Math.round((fraction || 0) * 10000) / 100

const renderCell = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'number') return formatNumber(value)
    if (typeof value === 'boolean') return value ? 'да' : 'нет'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

const formatDate = (iso?: string) => {
    if (!iso) return '—'
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('ru-RU', {dateStyle: 'medium', timeStyle: 'short'})
}

/* ================================================================== */
/*  shared bits                                                        */
/* ================================================================== */

const SectionHead = ({title, subtitle, action}: {title: string; subtitle: string; action?: ReactNode}) => (
    <header className="sales-head">
        <div className="sales-head-titles">
            <Txt size="l" tone="strong" block>{title}</Txt>
            <Txt size="xs" tone="faint" block>{subtitle}</Txt>
        </div>
        {action}
    </header>
)

const Loader = ({label}: {label: string}) => (
    <div className="sales-empty"><span className="sales-spin" /><Txt tone="dim">{label}</Txt></div>
)

const Alert = ({message}: {message: string}) => (
    <div className="sales-alert sales-alert-error"><Txt size="xs" tone="danger">{message}</Txt></div>
)

/* ================================================================== */
/*  Скидки                                                             */
/* ================================================================== */

interface SaleFormState {
    name: string;
    discount: string;
    priority: string;
    active: boolean;
    summary: boolean;
    isProduct: boolean;
    code: string;
    started_at: string;
    ended_at: string;
    condition: AnyDict[];
}

const emptySaleForm = (): SaleFormState => ({
    name: '',
    discount: '10',
    priority: '10',
    active: true,
    summary: false,
    isProduct: true,
    code: '',
    started_at: '2026-01-01T00:00',
    ended_at: '2030-01-01T00:00',
    condition: [],
})

const saleToForm = (sale: SaleRecord): SaleFormState => ({
    name: sale.name ?? '',
    discount: String(percentOf(sale.discount ?? 0)),
    priority: String(sale.priority ?? 0),
    active: Boolean(sale.active),
    summary: Boolean(sale.summary),
    isProduct: Boolean(sale.isProduct),
    code: sale.code ?? '',
    started_at: isoToLocalInput(sale.started_at),
    ended_at: isoToLocalInput(sale.ended_at),
    condition: Array.isArray(sale.condition) ? sale.condition : [],
})

const formToPayload = (form: SaleFormState): SalePayload => ({
    name: form.name.trim(),
    active: form.active,
    summary: form.summary,
    isProduct: form.isProduct,
    priority: Number(form.priority) || 0,
    discount: Number(form.discount) || 0,
    started_at: localInputToIso(form.started_at),
    ended_at: localInputToIso(form.ended_at),
    code: form.code.trim() ? form.code.trim() : null,
    condition: form.condition,
})

const recordToPayload = (sale: SaleRecord): SalePayload => ({
    name: sale.name,
    active: sale.active,
    summary: sale.summary,
    isProduct: sale.isProduct,
    priority: sale.priority ?? 0,
    discount: percentOf(sale.discount ?? 0),
    started_at: sale.started_at,
    ended_at: sale.ended_at,
    code: sale.code ?? null,
    condition: Array.isArray(sale.condition) ? sale.condition : [],
})

const validateSaleForm = (form: SaleFormState): string | null => {
    if (!form.name.trim()) return 'Укажите название скидки'
    const discount = Number(form.discount)
    if (Number.isNaN(discount) || discount < 0 || discount > 100) return 'Скидка — число от 0 до 100'
    if (!form.started_at || !form.ended_at) return 'Заполните даты начала и окончания'
    if (localInputToIso(form.ended_at) < localInputToIso(form.started_at)) return 'Дата окончания раньше даты начала'
    return null
}

const SalesSection = ({onToast}: {onToast: (message: string) => void}) => {
    const [sales, setSales] = useState<SaleRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

    const [formOpen, setFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [form, setForm] = useState<SaleFormState>(emptySaleForm)
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [togglingId, setTogglingId] = useState<number | null>(null)

    const refresh = useCallback(() => {
        setLoading(true)
        getSales()
            .then((data) => {
                setSales(Array.isArray(data.sale) ? data.sale : [])
                setLoadError(null)
            })
            .catch((error: Error) => setLoadError(error.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(refresh, [refresh])

    const patch = (next: Partial<SaleFormState>) => setForm((prev) => ({...prev, ...next}))

    const openCreate = () => {
        setEditingId(null)
        setForm(emptySaleForm())
        setFormError(null)
        setFormOpen(true)
    }

    const openEdit = (sale: SaleRecord) => {
        setEditingId(sale.id)
        setForm(saleToForm(sale))
        setFormError(null)
        setFormOpen(true)
    }

    const closeForm = () => {
        setFormOpen(false)
        setEditingId(null)
    }

    const submit = (e: SyntheticEvent) => {
        e.preventDefault()
        const problem = validateSaleForm(form)
        if (problem) {
            setFormError(problem)
            return
        }

        setSubmitting(true)
        setFormError(null)
        const payload = formToPayload(form)
        const action = editingId === null ? createSale(payload) : updateSale(editingId, payload)

        action
            .then(() => {
                onToast(editingId === null ? 'Скидка создана' : 'Скидка обновлена')
                closeForm()
                refresh()
            })
            .catch((error: Error) => setFormError(error.message))
            .finally(() => setSubmitting(false))
    }

    const remove = (sale: SaleRecord) => {
        if (!window.confirm(`Удалить скидку «${sale.name}»?`)) return
        setDeletingId(sale.id)
        deleteSale(sale.id)
            .then(() => {
                onToast('Скидка удалена')
                if (editingId === sale.id) closeForm()
                refresh()
            })
            .catch((error: Error) => onToast(error.message))
            .finally(() => setDeletingId(null))
    }

    const toggleActive = (sale: SaleRecord) => {
        if (togglingId !== null) return
        const next = !sale.active
        setTogglingId(sale.id)
        setSales((prev) => prev.map((item) => (item.id === sale.id ? {...item, active: next} : item)))

        updateSale(sale.id, recordToPayload({...sale, active: next}))
            .then(() => onToast(next ? 'Скидка включена' : 'Скидка выключена'))
            .catch((error: Error) => {
                setSales((prev) => prev.map((item) => (item.id === sale.id ? {...item, active: sale.active} : item)))
                onToast(error.message)
            })
            .finally(() => setTogglingId(null))
    }

    const ordered = useMemo(
        () => [...sales].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
        [sales],
    )

    return (
        <>
            <SectionHead
                title="Скидки"
                subtitle="Правила расчёта: приоритет, период действия и условия применения"
                action={!formOpen && (
                    <button type="button" className="sales-btn" onClick={openCreate}>
                        <IconPlus size={14} /><Txt size="xs" tone="onAccent">{'Новая скидка'}</Txt>
                    </button>
                )}
            />

            {formOpen && (
                <form className="sales-card sales-form" onSubmit={submit}>
                    <div className="sales-form-title">
                        <Txt size="m" tone="strong">{editingId === null ? 'Новая скидка' : `Скидка #${editingId}`}</Txt>
                        <button type="button" className="sales-link" onClick={closeForm}>
                            <Txt size="xs" tone="dim">{'Отмена'}</Txt>
                        </button>
                    </div>

                    <div className="sales-form-grid">
                        <TextField label="Название" placeholder="Весенняя распродажа" value={form.name} onChange={(e) => patch({name: e.target.value})} />
                        <TextField label="Промокод" hint="code, необязательно" placeholder="SPRING24" value={form.code} onChange={(e) => patch({code: e.target.value})} />
                        <TextField label="Скидка, %" type="number" min={0} max={100} step="0.01" value={form.discount} onChange={(e) => patch({discount: e.target.value})} />
                        <TextField label="Приоритет" type="number" step="1" value={form.priority} onChange={(e) => patch({priority: e.target.value})} />
                        <TextField label="Начало действия" type="datetime-local" value={form.started_at} onChange={(e) => patch({started_at: e.target.value})} />
                        <TextField label="Окончание действия" type="datetime-local" value={form.ended_at} onChange={(e) => patch({ended_at: e.target.value})} />
                    </div>

                    <div className="sales-toggles">
                        <Toggle checked={form.active} label="Активна" onChange={(v) => patch({active: v})} />
                        <Toggle checked={form.summary} label="Суммируется с другими" onChange={(v) => patch({summary: v})} />
                        <Toggle checked={form.isProduct} label="Скидка на товар" onChange={(v) => patch({isProduct: v})} />
                    </div>

                    <Field label="Условия применения" hint="condition — список объектов">
                        <DictListEditor
                            key={editingId ?? 'new'}
                            value={form.condition}
                            onChange={(condition) => patch({condition})}
                            newItem={() => ({field: '', operator: '==', value: ''})}
                        />
                    </Field>

                    {formError && <Alert message={formError} />}

                    <div className="sales-form-foot">
                        <button type="submit" className="sales-btn" disabled={submitting}>
                            <Txt size="xs" tone="onAccent">{submitting ? 'Сохранение…' : editingId === null ? 'Создать' : 'Сохранить'}</Txt>
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <Loader label="Загрузка скидок…" />
            ) : loadError ? (
                <div className="sales-empty">
                    <Txt tone="danger">{loadError}</Txt>
                    <button type="button" className="sales-btn-ghost" onClick={refresh}><Txt size="xs" tone="dim">{'Повторить'}</Txt></button>
                </div>
            ) : ordered.length === 0 ? (
                <div className="sales-empty"><Txt tone="dim">{'Скидок пока нет'}</Txt></div>
            ) : (
                <div className="sales-list">
                    {ordered.map((sale) => (
                        <article className={`scard${sale.active ? '' : ' scard-inactive'}`} key={sale.id}>
                            <div className="scard-body">
                                <div className="scard-title">
                                    <Txt size="m" tone="strong">{sale.name || 'Без названия'}</Txt>
                                    <button
                                        type="button"
                                        className="scard-status scard-status-btn"
                                        disabled={togglingId === sale.id}
                                        title={sale.active ? 'Выключить скидку' : 'Включить скидку'}
                                        onClick={() => toggleActive(sale)}
                                    >
                                        <span className={`dot ${sale.active ? 'dot-on' : 'dot-off'}`} />
                                        <Txt size="xs" tone="faint">{sale.active ? 'активна' : 'выключена'}</Txt>
                                    </button>
                                </div>

                                <div className="scard-tags">
                                    <span className="tag"><Txt size="xs" tone="dim">{`приоритет ${sale.priority ?? 0}`}</Txt></span>
                                    {sale.code && <span className="tag"><Txt size="xs" tone="dim">{`промокод ${sale.code}`}</Txt></span>}
                                    <span className="tag"><Txt size="xs" tone="dim">{sale.isProduct ? 'на товар' : 'на заказ'}</Txt></span>
                                    {sale.summary && <span className="tag"><Txt size="xs" tone="dim">{'суммируется'}</Txt></span>}
                                    <span className="tag"><Txt size="xs" tone="dim">{`${Array.isArray(sale.condition) ? sale.condition.length : 0} условий`}</Txt></span>
                                </div>

                                <Txt size="xs" tone="faint">{`${formatDate(sale.started_at)} → ${formatDate(sale.ended_at)}`}</Txt>
                            </div>

                            <div className="scard-aside">
                                <span className="scard-discount"><Txt size="l" tone="accent">{`−${formatNumber(percentOf(sale.discount ?? 0))}%`}</Txt></span>
                                <div className="scard-actions">
                                    <button type="button" className="sales-icon-btn" title="Изменить" onClick={() => openEdit(sale)}>
                                        <IconPencil size={14} />
                                    </button>
                                    <button type="button" className="sales-icon-btn sales-icon-btn-danger" title="Удалить" disabled={deletingId === sale.id} onClick={() => remove(sale)}>
                                        <IconTrash size={14} />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    )
}

/* ================================================================== */
/*  Клиенты и товары                                                   */
/* ================================================================== */

interface CrudFieldDef {
    key: string;
    label: string;
    placeholder?: string;
    type?: string;
}

interface CrudSectionProps<R extends {id: number}> {
    title: string;
    subtitle: string;
    fields: CrudFieldDef[];
    primaryKey: string;
    load: () => Promise<R[]>;
    create: (form: Record<string, string>) => Promise<unknown>;
    remove: (record: R) => Promise<unknown>;
    onToast: (message: string) => void;
}

function CrudSection<R extends {id: number}>({title, subtitle, fields, primaryKey, load, create, remove, onToast}: CrudSectionProps<R>) {
    const blank = useMemo(() => Object.fromEntries(fields.map((field) => [field.key, ''])), [fields])
    const [records, setRecords] = useState<R[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [form, setForm] = useState<Record<string, string>>(blank)
    const [busy, setBusy] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const refresh = useCallback(() => {
        setLoading(true)
        load()
            .then((rows) => {
                setRecords(Array.isArray(rows) ? rows : [])
                setLoadError(null)
            })
            .catch((error: Error) => setLoadError(error.message))
            .finally(() => setLoading(false))
    }, [load])

    useEffect(refresh, [refresh])

    const submit = (e: SyntheticEvent) => {
        e.preventDefault()
        const missing = fields.find((field) => !form[field.key]?.trim())
        if (missing) {
            setFormError(`Заполните поле «${missing.label}»`)
            return
        }
        setBusy(true)
        setFormError(null)
        create(form)
            .then(() => {
                onToast(`${title}: запись создана`)
                setForm(blank)
                refresh()
            })
            .catch((error: Error) => setFormError(error.message))
            .finally(() => setBusy(false))
    }

    const onDelete = (record: R) => {
        const label = String((record as Record<string, unknown>)[primaryKey] ?? record.id)
        if (!window.confirm(`Удалить «${label}»?`)) return
        setDeletingId(record.id)
        remove(record)
            .then(() => {
                onToast(`${title}: запись удалена`)
                refresh()
            })
            .catch((error: Error) => onToast(error.message))
            .finally(() => setDeletingId(null))
    }

    return (
        <>
            <SectionHead title={title} subtitle={subtitle} />

            <form className="sales-card sales-form" onSubmit={submit}>
                <div className="sales-form-grid">
                    {fields.map((field) => (
                        <TextField
                            key={field.key}
                            label={field.label}
                            placeholder={field.placeholder}
                            type={field.type ?? 'text'}
                            value={form[field.key] ?? ''}
                            onChange={(e) => setForm((prev) => ({...prev, [field.key]: e.target.value}))}
                        />
                    ))}
                </div>

                {formError && <Alert message={formError} />}

                <div className="sales-form-foot">
                    <button type="submit" className="sales-btn" disabled={busy}>
                        <IconPlus size={14} /><Txt size="xs" tone="onAccent">{busy ? 'Сохранение…' : 'Добавить'}</Txt>
                    </button>
                </div>
            </form>

            {loading ? (
                <Loader label="Загрузка…" />
            ) : loadError ? (
                <div className="sales-empty">
                    <Txt tone="danger">{loadError}</Txt>
                    <button type="button" className="sales-btn-ghost" onClick={refresh}><Txt size="xs" tone="dim">{'Повторить'}</Txt></button>
                </div>
            ) : records.length === 0 ? (
                <div className="sales-empty"><Txt tone="dim">{'Записей пока нет'}</Txt></div>
            ) : (
                <div className="sales-list">
                    {records.map((record) => {
                        const row = record as Record<string, unknown>
                        return (
                            <article className="ecard" key={record.id}>
                                <div className="ecard-info">
                                    <div className="ecard-title">
                                        <Txt size="m" tone="strong">{renderCell(row[primaryKey])}</Txt>
                                        <Txt size="xs" tone="faint">{`#${record.id}`}</Txt>
                                    </div>
                                    <div className="scard-tags">
                                        {fields.filter((field) => field.key !== primaryKey).map((field) => (
                                            <span className="tag" key={field.key}>
                                                <Txt size="xs" tone="faint">{`${field.label}: `}</Txt>
                                                <Txt size="xs" tone="dim">{renderCell(row[field.key])}</Txt>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="sales-icon-btn sales-icon-btn-danger"
                                    title="Удалить"
                                    disabled={deletingId === record.id}
                                    onClick={() => onDelete(record)}
                                >
                                    <IconTrash size={14} />
                                </button>
                            </article>
                        )
                    })}
                </div>
            )}
        </>
    )
}

/* ================================================================== */
/*  Расчёт цены                                                        */
/* ================================================================== */

interface CartRow {
    product: string;
    quantity: string;
}

interface CalcFormState {
    user_id: string;
    promocode: string;
    ball: string;
    partner_card: boolean;
    param_datetime: string;
    cart: CartRow[];
}

const emptyCartRow = (): CartRow => ({product: '', quantity: '1'})

const emptyCalcForm = (): CalcFormState => ({
    user_id: '',
    promocode: '',
    ball: '0',
    partner_card: false,
    param_datetime: '',
    cart: [emptyCartRow()],
})

const cartToPayload = (cart: CartRow[]): AnyDict[] =>
    cart
        .filter((row) => row.product !== '')
        .map((row) => ({product: Number(row.product), quantity: Number(row.quantity) || 0}))

const CartEditor = ({value, onChange, products}: {
    value: CartRow[];
    onChange: (next: CartRow[]) => void;
    products: ProductRecord[];
}) => {
    const update = (index: number, patch: Partial<CartRow>) =>
        onChange(value.map((row, i) => (i === index ? {...row, ...patch} : row)))
    const addRow = () => onChange([...value, emptyCartRow()])
    const removeRow = (index: number) => onChange(value.filter((_, i) => i !== index))

    const payload = cartToPayload(value)

    return (
        <div className="sales-dict">
            {value.length === 0 && (
                <div className="sales-dict-empty"><Txt size="xs" tone="faint">{'Добавьте хотя бы один товар'}</Txt></div>
            )}

            {value.map((row, index) => (
                <div className="cart-row" key={index}>
                    <select
                        className="sales-input sales-select jost"
                        value={row.product}
                        onChange={(e) => update(index, {product: e.target.value})}
                    >
                        <option value="">{products.length ? '— выберите товар —' : 'нет товаров'}</option>
                        {products.map((product) => (
                            <option key={product.id} value={String(product.id)}>
                                {`${product.name} · ${formatNumber(product.price)} ₽`}
                            </option>
                        ))}
                    </select>
                    <input
                        className="sales-input jost cart-qty"
                        type="number"
                        min={1}
                        step={1}
                        value={row.quantity}
                        onChange={(e) => update(index, {quantity: e.target.value})}
                    />
                    <button type="button" className="sales-icon-btn" title="Убрать" onClick={() => removeRow(index)}>
                        <IconClose size={13} />
                    </button>
                </div>
            ))}

            <button type="button" className="sales-btn-dashed" onClick={addRow}>
                <IconPlus size={13} /><Txt size="xs" tone="dim">{'Добавить товар'}</Txt>
            </button>

            {payload.length > 0 && <code className="sales-dict-preview jost">{JSON.stringify(payload)}</code>}
        </div>
    )
}

const CalcSection = ({onToast}: {onToast: (message: string) => void}) => {
    const [form, setForm] = useState<CalcFormState>(emptyCalcForm)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<PriceResult | null>(null)
    const [elapsedMs, setElapsedMs] = useState<number | null>(null)
    const [rawOpen, setRawOpen] = useState(false)

    const [users, setUsers] = useState<UserRecord[]>([])
    const [products, setProducts] = useState<ProductRecord[]>([])
    const [refLoading, setRefLoading] = useState(true)
    const [refError, setRefError] = useState<string | null>(null)

    const loadRefs = useCallback(() => {
        setRefLoading(true)
        Promise.all([getUsers(), getProducts()])
            .then(([usersData, productsData]) => {
                const usersList = Array.isArray(usersData.users) ? usersData.users : []
                setUsers(usersList)
                setProducts(Array.isArray(productsData.products) ? productsData.products : [])
                setRefError(null)

                const defaultUser = usersList.find((user) => user.id === 1) ?? usersList[0]
                if (defaultUser) {
                    setForm((prev) => (prev.user_id ? prev : {...prev, user_id: String(defaultUser.id)}))
                }
            })
            .catch((err: Error) => setRefError(err.message))
            .finally(() => setRefLoading(false))
    }, [])

    useEffect(loadRefs, [loadRefs])

    const patch = (next: Partial<CalcFormState>) => setForm((prev) => ({...prev, ...next}))

    const submit = (e: SyntheticEvent) => {
        e.preventDefault()
        if (!form.user_id) {
            setError('Выберите клиента')
            return
        }
        const productId = cartToPayload(form.cart)
        if (productId.length === 0) {
            setError('Добавьте хотя бы один товар в корзину')
            return
        }

        const query: PriceQuery = {
            user_id: Number(form.user_id),
            product_id: productId,
            promocode: form.promocode.trim(),
            partner_card: form.partner_card,
            ball: Number(form.ball) || 0,
        }

        setBusy(true)
        setError(null)
        const startedAt = performance.now()
        getPrice(query, form.param_datetime ? localInputToIso(form.param_datetime) : undefined)
            .then((data) => {
                setResult(data)
                onToast('Цена рассчитана')
            })
            .catch((err: Error) => {
                setResult(null)
                setError(err.message)
            })
            .finally(() => {
                setElapsedMs(performance.now() - startedAt)
                setBusy(false)
            })
    }

    const userSales = useMemo<unknown[]>(
        () => (Array.isArray(result?.user_sales) ? (result?.user_sales as unknown[]) : []),
        [result],
    )

    return (
        <>
            <SectionHead
                title="Расчёт цены"
                subtitle="POST /get-price — итоговая цена корзины с учётом скидок, промокода и баллов"
            />

            {refLoading ? (
                <Loader label="Загрузка клиентов и товаров…" />
            ) : refError ? (
                <div className="sales-empty">
                    <Txt tone="danger">{refError}</Txt>
                    <button type="button" className="sales-btn-ghost" onClick={loadRefs}><Txt size="xs" tone="dim">{'Повторить'}</Txt></button>
                </div>
            ) : (
            <form className="sales-card sales-form" onSubmit={submit}>
                <div className="sales-form-grid">
                    <Field label="Клиент" hint="user_id">
                        <select
                            className="sales-input sales-select jost"
                            value={form.user_id}
                            onChange={(e) => patch({user_id: e.target.value})}
                        >
                            <option value="">{users.length ? '— выберите клиента —' : 'нет клиентов'}</option>
                            {users.map((user) => (
                                <option key={user.id} value={String(user.id)}>
                                    {`${user.name} · ${user.region} · ${user.status}`}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <TextField label="Промокод" placeholder="promocode" value={form.promocode} onChange={(e) => patch({promocode: e.target.value})} />
                    <TextField label="Баллы к списанию" type="number" value={form.ball} onChange={(e) => patch({ball: e.target.value})} />
                    <TextField label="Дата расчёта" hint="param_datetime, необязательно" type="datetime-local" value={form.param_datetime} onChange={(e) => patch({param_datetime: e.target.value})} />
                </div>

                <div className="sales-toggles">
                    <Toggle checked={form.partner_card} label="Карта партнёра" onChange={(v) => patch({partner_card: v})} />
                </div>

                <Field label="Корзина" hint="product_id — [{ product, quantity }]">
                    <CartEditor value={form.cart} onChange={(cart) => patch({cart})} products={products} />
                </Field>

                {error && <Alert message={error} />}

                <div className="sales-form-foot">
                    {elapsedMs !== null && (
                        <span className="calc-timing">
                            <span className={`calc-timing-dot ${elapsedMs <= 5 ? 'calc-timing-dot-ok' : 'calc-timing-dot-slow'}`} />
                            <Txt size="xs" tone={elapsedMs <= 5 ? 'ok' : 'danger'}>{`${elapsedMs.toFixed(1)} мс`}</Txt>
                        </span>
                    )}
                    <button type="submit" className="sales-btn" disabled={busy}>
                        <Txt size="xs" tone="onAccent">{busy ? 'Расчёт…' : 'Рассчитать'}</Txt>
                    </button>
                </div>
            </form>
            )}

            {result && (
                <div className="sales-card sales-result">
                    <div className="result-hero">
                        <Txt size="xs" tone="dim" caps>{'Итоговая цена'}</Txt>
                        <Txt size="xl" tone="strong">{`${formatNumber(Number(result.price) || 0)} ₽`}</Txt>
                    </div>

                    <div className="result-block">
                        <Txt size="xs" tone="faint" caps>{'Товары'}</Txt>
                        {Array.isArray(result.products) && result.products.length > 0 ? (
                            <div className="result-grid">
                                {result.products.map((product, index) => (
                                    <div className="result-card" key={index}>
                                        {Object.entries(product).map(([key, val]) => (
                                            <div className="kv" key={key}>
                                                <Txt size="xs" tone="faint">{key}</Txt>
                                                <Txt size="xs" tone="default">{renderCell(val)}</Txt>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Txt size="xs" tone="dim">{'—'}</Txt>
                        )}
                    </div>

                    <div className="result-block">
                        <Txt size="xs" tone="faint" caps>{'Скидки клиента'}</Txt>
                        {userSales.length > 0 ? (
                            <div className="result-grid">
                                {userSales.map((entry, index) => (
                                    <div className="result-card" key={index}>
                                        {entry && typeof entry === 'object' ? (
                                            Object.entries(entry as AnyDict).map(([key, val]) => (
                                                <div className="kv" key={key}>
                                                    <Txt size="xs" tone="faint">{key}</Txt>
                                                    <Txt size="xs" tone="default">{renderCell(val)}</Txt>
                                                </div>
                                            ))
                                        ) : (
                                            <Txt size="xs" tone="default">{renderCell(entry)}</Txt>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Txt size="xs" tone="dim">{'Скидки не применялись'}</Txt>
                        )}
                    </div>

                    <button type="button" className="sales-link" onClick={() => setRawOpen((v) => !v)}>
                        <span className={`sales-link-chev${rawOpen ? ' sales-link-chev-open' : ''}`}><IconChevron size={13} /></span>
                        <Txt size="xs" tone="accent">{rawOpen ? 'Скрыть ответ' : 'Показать ответ целиком'}</Txt>
                    </button>
                    {rawOpen && <pre className="result-raw jost">{JSON.stringify(result, null, 2)}</pre>}
                </div>
            )}
        </>
    )
}

/* ================================================================== */
/*  Тесты — нагрузка и статистика по /get-price                        */
/* ================================================================== */

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const sample = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]
const PROMOCODES = ['SALE', 'SPRING', 'VIP', 'TEST', 'WINTER', 'FRIEND']

const clampInt = (value: string, min: number, max: number, fallback: number) => {
    const parsed = Math.round(Number(value))
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
}

const buildRandomQuery = (users: UserRecord[], products: ProductRecord[]): PriceQuery => {
    const size = products.length ? randInt(1, Math.min(3, products.length)) : 1
    const chosen = [...products].sort(() => Math.random() - 0.5).slice(0, size)
    return {
        user_id: users.length ? sample(users).id : randInt(1, 5),
        product_id: chosen.length
            ? chosen.map((product) => ({product: product.id, quantity: randInt(1, 5)}))
            : [{product: randInt(1, 5), quantity: randInt(1, 5)}],
        promocode: Math.random() < 0.3 ? sample(PROMOCODES) : '',
        partner_card: Math.random() < 0.5,
        ball: Math.random() < 0.5 ? 0 : randInt(1, 500),
    }
}

interface LoadStats {
    total: number;
    ok: number;
    failed: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    rps: number;
    wallMs: number;
}

const percentile = (sorted: number[], p: number) => {
    if (!sorted.length) return 0
    const rank = Math.ceil((p / 100) * sorted.length)
    return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))]
}

const computeStats = (probes: Probe[], wallMs: number): LoadStats => {
    const times = probes.filter((probe) => probe.ok).map((probe) => probe.ms).sort((a, b) => a - b)
    const sum = times.reduce((acc, ms) => acc + ms, 0)
    return {
        total: probes.length,
        ok: times.length,
        failed: probes.length - times.length,
        min: times[0] ?? 0,
        max: times[times.length - 1] ?? 0,
        avg: times.length ? sum / times.length : 0,
        p50: percentile(times, 50),
        p90: percentile(times, 90),
        p95: percentile(times, 95),
        p99: percentile(times, 99),
        rps: wallMs > 0 ? (times.length / wallMs) * 1000 : 0,
        wallMs,
    }
}

const runPool = async (
    tasks: (() => Promise<Probe>)[],
    concurrency: number,
    onEach: (probe: Probe) => void,
) => {
    let cursor = 0
    const worker = async () => {
        while (cursor < tasks.length) {
            const index = cursor++
            onEach(await tasks[index]())
        }
    }
    await Promise.all(Array.from({length: Math.min(concurrency, tasks.length)}, worker))
}

const ms1 = (value: number) => `${value.toFixed(1)} мс`

const Tile = ({label, value, tone = 'strong'}: {label: string; value: string; tone?: 'strong' | 'ok' | 'danger' | 'default'}) => (
    <div className="test-tile">
        <Txt size="xs" tone="faint" caps>{label}</Txt>
        <Txt size="m" tone={tone}>{value}</Txt>
    </div>
)

interface SmokeRow {
    label: string;
    probe: Probe;
}

const TestsSection = ({onToast}: {onToast: (message: string) => void}) => {
    const [users, setUsers] = useState<UserRecord[]>([])
    const [products, setProducts] = useState<ProductRecord[]>([])
    const [refLoading, setRefLoading] = useState(true)
    const [refError, setRefError] = useState<string | null>(null)

    const [count, setCount] = useState('40')
    const [concurrency, setConcurrency] = useState('4')

    const [running, setRunning] = useState(false)
    const [planned, setPlanned] = useState(0)
    const [done, setDone] = useState(0)
    const [probes, setProbes] = useState<Probe[]>([])
    const [stats, setStats] = useState<LoadStats | null>(null)

    const [smokeRunning, setSmokeRunning] = useState(false)
    const [smoke, setSmoke] = useState<SmokeRow[] | null>(null)

    const loadRefs = useCallback(() => {
        setRefLoading(true)
        Promise.all([getUsers(), getProducts()])
            .then(([usersData, productsData]) => {
                setUsers(Array.isArray(usersData.users) ? usersData.users : [])
                setProducts(Array.isArray(productsData.products) ? productsData.products : [])
                setRefError(null)
            })
            .catch((err: Error) => setRefError(err.message))
            .finally(() => setRefLoading(false))
    }, [])

    useEffect(loadRefs, [loadRefs])

    const runLoadTest = () => {
        const total = clampInt(count, 1, 300, 40)
        const conc = clampInt(concurrency, 1, 16, 4)
        setCount(String(total))
        setConcurrency(String(conc))

        setRunning(true)
        setPlanned(total)
        setDone(0)
        setProbes([])
        setStats(null)

        const collected: Probe[] = []
        const tasks = Array.from({length: total}, () => () => probeGetPrice(buildRandomQuery(users, products)))
        const start = performance.now()

        runPool(tasks, conc, (probe) => {
            collected.push(probe)
            setDone(collected.length)
            setProbes(collected.slice())
        })
            .then(() => {
                const summary = computeStats(collected, performance.now() - start)
                setStats(summary)
                onToast(`Готово: ${summary.ok}/${summary.total} · avg ${summary.avg.toFixed(1)} мс · ${formatNumber(summary.rps)} rps`)
            })
            .finally(() => setRunning(false))
    }

    const runSmoke = () => {
        setSmokeRunning(true)
        const checks: {label: string; run: () => Promise<Probe>}[] = [
            {label: 'GET /get-sales', run: () => probeEndpoint('/get-sales')},
            {label: 'GET /get-users', run: () => probeEndpoint('/get-users')},
            {label: 'GET /get-products', run: () => probeEndpoint('/get-products')},
            {label: 'POST /get-price', run: () => probeGetPrice(buildRandomQuery(users, products))},
        ]
        Promise.all(checks.map((check) => check.run().then((probe) => ({label: check.label, probe}))))
            .then(setSmoke)
            .finally(() => setSmokeRunning(false))
    }

    const maxMs = useMemo(() => probes.reduce((acc, probe) => Math.max(acc, probe.ms), 1), [probes])
    const view = useMemo<LoadStats | null>(
        () => stats ?? (probes.length ? computeStats(probes, 0) : null),
        [stats, probes],
    )

    return (
        <>
            <SectionHead
                title="Тесты"
                subtitle="Нагрузка на /get-price: пачка мелких случайных запросов и статистика скорости"
            />

            {refLoading ? (
                <Loader label="Загрузка клиентов и товаров…" />
            ) : refError ? (
                <div className="sales-empty">
                    <Txt tone="danger">{refError}</Txt>
                    <button type="button" className="sales-btn-ghost" onClick={loadRefs}><Txt size="xs" tone="dim">{'Повторить'}</Txt></button>
                </div>
            ) : (
                <>
                    <div className="sales-card sales-form">
                        <div className="sales-form-title">
                            <Txt size="m" tone="strong">{'Нагрузочный тест'}</Txt>
                            <Txt size="xs" tone="faint">{`${users.length} клиентов · ${products.length} товаров`}</Txt>
                        </div>

                        <div className="sales-form-grid">
                            <TextField
                                label="Запросов"
                                hint="1–300"
                                type="number"
                                min={1}
                                max={300}
                                value={count}
                                onChange={(e) => setCount(e.target.value)}
                            />
                            <TextField
                                label="Параллельно"
                                hint="1–16"
                                type="number"
                                min={1}
                                max={16}
                                value={concurrency}
                                onChange={(e) => setConcurrency(e.target.value)}
                            />
                        </div>

                        <div className="sales-alert test-note">
                            <Txt size="xs" tone="dim">{'Сервер локальный — держите ≤ 100 запросов и 2–8 параллельных потоков.'}</Txt>
                        </div>

                        {running && (
                            <div className="test-progress">
                                <div className="test-progress-bar" style={{width: `${planned ? (done / planned) * 100 : 0}%`}} />
                            </div>
                        )}

                        <div className="sales-form-foot">
                            {running && <Txt size="xs" tone="dim">{`${done} / ${planned}`}</Txt>}
                            <button type="button" className="sales-btn" disabled={running} onClick={runLoadTest}>
                                <IconActivity size={14} /><Txt size="xs" tone="onAccent">{running ? 'Идёт тест…' : 'Запустить'}</Txt>
                            </button>
                        </div>
                    </div>

                    {view && (
                        <div className="sales-card sales-result">
                            <div className="test-tiles">
                                <Tile label="Запросов" value={String(view.total)} />
                                <Tile label="Успешно" value={String(view.ok)} tone="ok" />
                                <Tile label="Ошибок" value={String(view.failed)} tone={view.failed ? 'danger' : 'default'} />
                                {stats && <Tile label="RPS" value={formatNumber(stats.rps)} />}
                                {stats && <Tile label="Время" value={`${(stats.wallMs / 1000).toFixed(2)} с`} />}
                                <Tile label="min" value={ms1(view.min)} />
                                <Tile label="avg" value={ms1(view.avg)} />
                                <Tile label="p50" value={ms1(view.p50)} />
                                <Tile label="p90" value={ms1(view.p90)} />
                                <Tile label="p95" value={ms1(view.p95)} />
                                <Tile label="p99" value={ms1(view.p99)} />
                                <Tile label="max" value={ms1(view.max)} />
                            </div>

                            <div className="result-block">
                                <Txt size="xs" tone="faint" caps>{'Задержка по запросам'}</Txt>
                                <div className="test-bars">
                                    {probes.map((probe, index) => {
                                        const height = Math.max(3, Math.round((probe.ms / maxMs) * 100))
                                        const kind = !probe.ok
                                            ? 'test-bar-fail'
                                            : probe.ms <= 20
                                                ? 'test-bar-fast'
                                                : probe.ms <= 80
                                                    ? 'test-bar-mid'
                                                    : 'test-bar-slow'
                                        return (
                                            <span
                                                key={index}
                                                className={`test-bar ${kind}`}
                                                style={{height: `${height}%`}}
                                                title={`#${index + 1}: ${probe.ms.toFixed(1)} мс${probe.ok ? '' : ` · ошибка ${probe.status || 'сеть'}`}`}
                                            />
                                        )
                                    })}
                                </div>
                                <div className="test-legend">
                                    <span className="test-legend-item"><span className="dot test-dot-fast" /><Txt size="xs" tone="faint">{'≤ 20 мс'}</Txt></span>
                                    <span className="test-legend-item"><span className="dot test-dot-mid" /><Txt size="xs" tone="faint">{'≤ 80 мс'}</Txt></span>
                                    <span className="test-legend-item"><span className="dot test-dot-slow" /><Txt size="xs" tone="faint">{'> 80 мс'}</Txt></span>
                                    <span className="test-legend-item"><span className="dot dot-off test-dot-fail" /><Txt size="xs" tone="faint">{'ошибка'}</Txt></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="sales-card sales-form">
                        <div className="sales-form-title">
                            <Txt size="m" tone="strong">{'Проверка эндпоинтов'}</Txt>
                            <button type="button" className="sales-btn-ghost" disabled={smokeRunning} onClick={runSmoke}>
                                <Txt size="xs" tone="dim">{smokeRunning ? 'Проверка…' : 'Проверить'}</Txt>
                            </button>
                        </div>

                        {smoke && (
                            <div className="test-smoke">
                                {smoke.map((row) => (
                                    <div className="test-smoke-row" key={row.label}>
                                        <span className={`dot ${row.probe.ok ? 'dot-on' : 'dot-off'}`} />
                                        <Txt size="xs" tone="default">{row.label}</Txt>
                                        <span className="test-smoke-meta">
                                            <Txt size="xs" tone={row.probe.ok ? 'faint' : 'danger'}>
                                                {row.probe.ok ? `${row.probe.status} · ${ms1(row.probe.ms)}` : `ошибка ${row.probe.status || 'сеть'} · ${ms1(row.probe.ms)}`}
                                            </Txt>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    )
}

/* ================================================================== */
/*  Наполнение БД тестовыми данными                                    */
/* ================================================================== */

const SEED_REGIONS = ['MSK', 'SPB', 'NSK', 'EKB', 'KZN', 'SAM']
const SEED_STATUSES = ['new', 'regular', 'vip', 'silver', 'gold']
const SEED_CATEGORIES = ['coffee', 'tea', 'bakery', 'grocery', 'snacks', 'drinks']

const buildTestSale = (n: number): SalePayload => {
    const isProduct = Math.random() < 0.6
    return {
        name: `${TEST_PREFIX} Скидка ${n}`,
        active: Math.random() < 0.85,
        summary: Math.random() < 0.5,
        isProduct,
        priority: randInt(1, 20),
        discount: randInt(5, 40),
        started_at: '2026-01-01T00:00:00.000Z',
        ended_at: '2030-01-01T00:00:00.000Z',
        code: Math.random() < 0.3 ? `TEST${n}` : null,
        condition: [
            isProduct
                ? {field: 'product.quantity', operator: sample(['>=', '>', '==', '<=']), value: randInt(10, 100)}
                : {field: 'user.status', operator: sample(['==', '!=']), value: sample(SEED_STATUSES)},
        ],
    }
}

const buildTestUser = (n: number): UserPayload => ({
    name: `${TEST_PREFIX} Клиент ${n}`,
    region: sample(SEED_REGIONS),
    status: sample(SEED_STATUSES),
})

const buildTestProduct = (n: number): ProductPayload => {
    const price = randInt(100, 5000)
    return {
        name: `${TEST_PREFIX} Товар ${n}`,
        price,
        card_price: Math.round(price * (0.8 + Math.random() * 0.18)),
        category: sample(SEED_CATEGORIES),
    }
}

const mapPool = async <T,>(items: T[], concurrency: number, task: (item: T) => Promise<void>) => {
    let cursor = 0
    const worker = async () => {
        while (cursor < items.length) {
            await task(items[cursor++])
        }
    }
    await Promise.all(Array.from({length: Math.min(concurrency, items.length) || 1}, worker))
}

interface TestCounts {
    sales: number;
    users: number;
    products: number;
}

const SeedSection = ({onToast}: {onToast: (message: string) => void}) => {
    const [salesN, setSalesN] = useState('5')
    const [usersN, setUsersN] = useState('10')
    const [productsN, setProductsN] = useState('10')

    const [seeding, setSeeding] = useState(false)
    const [seedDone, setSeedDone] = useState(0)
    const [seedTotal, setSeedTotal] = useState(0)

    const [counts, setCounts] = useState<TestCounts | null>(null)
    const [countsLoading, setCountsLoading] = useState(true)
    const [countsError, setCountsError] = useState<string | null>(null)
    const [purging, setPurging] = useState(false)

    const refreshCounts = useCallback(() => {
        setCountsLoading(true)
        Promise.all([getSales(), getUsers(), getProducts()])
            .then(([salesData, usersData, productsData]) => {
                setCounts({
                    sales: (salesData.sale ?? []).filter((item) => isTestName(item.name)).length,
                    users: (usersData.users ?? []).filter((item) => isTestName(item.name)).length,
                    products: (productsData.products ?? []).filter((item) => isTestName(item.name)).length,
                })
                setCountsError(null)
            })
            .catch((err: Error) => setCountsError(err.message))
            .finally(() => setCountsLoading(false))
    }, [])

    useEffect(refreshCounts, [refreshCounts])

    const seed = () => {
        const nSales = clampInt(salesN, 0, 100, 5)
        const nUsers = clampInt(usersN, 0, 200, 10)
        const nProducts = clampInt(productsN, 0, 200, 10)
        setSalesN(String(nSales))
        setUsersN(String(nUsers))
        setProductsN(String(nProducts))

        const jobs: (() => Promise<void>)[] = [
            ...Array.from({length: nUsers}, (_, i) => () => createUser(buildTestUser(i + 1)).then(() => undefined)),
            ...Array.from({length: nProducts}, (_, i) => () => createProduct(buildTestProduct(i + 1)).then(() => undefined)),
            ...Array.from({length: nSales}, (_, i) => () => createSale(buildTestSale(i + 1)).then(() => undefined)),
        ]
        if (jobs.length === 0) return

        setSeeding(true)
        setSeedTotal(jobs.length)
        setSeedDone(0)
        let failed = 0
        let completed = 0

        mapPool(jobs, 3, (job) =>
            job()
                .catch(() => { failed += 1 })
                .finally(() => {
                    completed += 1
                    setSeedDone(completed)
                }))
            .then(() => {
                onToast(failed
                    ? `Создано ${jobs.length - failed}/${jobs.length}, ошибок: ${failed}`
                    : `Создано ${jobs.length} тестовых записей`)
                refreshCounts()
            })
            .finally(() => setSeeding(false))
    }

    const purge = () => {
        if (!window.confirm(`Удалить все записи с именем «${TEST_PREFIX} …» — скидки, клиентов и товары?`)) return
        setPurging(true)

        Promise.all([getSales(), getUsers(), getProducts()])
            .then(([salesData, usersData, productsData]) => {
                const jobs: (() => Promise<void>)[] = [
                    ...(salesData.sale ?? []).filter((item) => isTestName(item.name)).map((item) => () => deleteSale(item.id).then(() => undefined)),
                    ...(usersData.users ?? []).filter((item) => isTestName(item.name)).map((item) => () => deleteUser(item.id).then(() => undefined)),
                    ...(productsData.products ?? []).filter((item) => isTestName(item.name)).map((item) => () => deleteProduct(item.id).then(() => undefined)),
                ]
                if (jobs.length === 0) {
                    onToast('Тестовых записей не найдено')
                    return undefined
                }
                let failed = 0
                return mapPool(jobs, 3, (job) => job().catch(() => { failed += 1 })).then(() => {
                    onToast(failed
                        ? `Удалено ${jobs.length - failed}/${jobs.length}, ошибок: ${failed}`
                        : `Удалено ${jobs.length} тестовых записей`)
                })
            })
            .catch((err: Error) => onToast(err.message))
            .finally(() => {
                setPurging(false)
                refreshCounts()
            })
    }

    const totalTest = counts ? counts.sales + counts.users + counts.products : 0

    return (
        <>
            <SectionHead
                title="Наполнение БД"
                subtitle={`Тестовые скидки, клиенты и товары с префиксом «${TEST_PREFIX}» — удаляются одной кнопкой`}
            />

            <div className="sales-card sales-form">
                <div className="sales-form-title">
                    <Txt size="m" tone="strong">{'Сгенерировать данные'}</Txt>
                    <Txt size="xs" tone="faint">{`имена вида «${TEST_PREFIX} Клиент 12»`}</Txt>
                </div>

                <div className="sales-form-grid">
                    <TextField label="Скидок" type="number" min={0} max={100} value={salesN} onChange={(e) => setSalesN(e.target.value)} />
                    <TextField label="Клиентов" type="number" min={0} max={200} value={usersN} onChange={(e) => setUsersN(e.target.value)} />
                    <TextField label="Товаров" type="number" min={0} max={200} value={productsN} onChange={(e) => setProductsN(e.target.value)} />
                </div>

                {seeding && (
                    <div className="test-progress">
                        <div className="test-progress-bar" style={{width: `${seedTotal ? (seedDone / seedTotal) * 100 : 0}%`}} />
                    </div>
                )}

                <div className="sales-form-foot">
                    {seeding && <Txt size="xs" tone="dim">{`${seedDone} / ${seedTotal}`}</Txt>}
                    <button type="button" className="sales-btn" disabled={seeding} onClick={seed}>
                        <IconPlus size={14} /><Txt size="xs" tone="onAccent">{seeding ? 'Создание…' : 'Создать'}</Txt>
                    </button>
                </div>
            </div>

            <div className="sales-card sales-form">
                <div className="sales-form-title">
                    <Txt size="m" tone="strong">{'Тестовые записи в БД'}</Txt>
                    <button type="button" className="sales-link" disabled={countsLoading} onClick={refreshCounts}>
                        <Txt size="xs" tone="accent">{countsLoading ? 'Обновление…' : 'Обновить'}</Txt>
                    </button>
                </div>

                {countsError ? (
                    <Alert message={countsError} />
                ) : (
                    <div className="test-tiles">
                        <Tile label="Скидок" value={String(counts?.sales ?? '—')} />
                        <Tile label="Клиентов" value={String(counts?.users ?? '—')} />
                        <Tile label="Товаров" value={String(counts?.products ?? '—')} />
                        <Tile label="Всего" value={String(totalTest)} />
                    </div>
                )}

                <div className="sales-form-foot">
                    <button
                        type="button"
                        className="sales-btn-danger"
                        disabled={purging || totalTest === 0}
                        onClick={purge}
                    >
                        <IconTrash size={14} /><Txt size="xs" tone="onAccent">{purging ? 'Удаление…' : 'Удалить всё тестовое'}</Txt>
                    </button>
                </div>
            </div>
        </>
    )
}

/* ================================================================== */
/*  Страница                                                           */
/* ================================================================== */

export const SalesPage = () => {
    const [section, setSection] = useState<Section>('sales')
    const [toast, setToast] = useState<string | null>(null)

    const showToast = useCallback((message: string) => {
        setToast(message)
        window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2600)
    }, [])

    return (
        <div className="sales-app">
            <aside className="sales-side">
                <div className="sales-brand">
                    <span className="sales-brand-mark"><IconLayers size={16} /></span>
                    <span className="sales-brand-text">
                        <Txt size="m" tone="strong">{'Pricing'}</Txt>
                        <Txt size="xs" tone="faint">{'консоль скидок'}</Txt>
                    </span>
                </div>

                <nav className="sales-nav">
                    {NAV.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`sales-nav-btn${section === item.id ? ' sales-nav-btn-active' : ''}`}
                            onClick={() => setSection(item.id)}
                        >
                            {item.icon}
                            <Txt size="s" tone={section === item.id ? 'onAccent' : 'dim'}>{item.label}</Txt>
                        </button>
                    ))}
                </nav>

                <div className="sales-side-foot">
                    <Txt size="xs" tone="faint">{'API · localhost:8000'}</Txt>
                </div>
            </aside>

            <main className="sales-body">
                <div className="sales-view">
                    {section === 'sales' && <SalesSection onToast={showToast} />}
                    {section === 'users' && (
                        <CrudSection<UserRecord>
                            title="Клиенты"
                            subtitle="POST /create-user · GET /get-users · POST /delete-user"
                            primaryKey="name"
                            fields={[
                                {key: 'name', label: 'Имя', placeholder: 'Иван Иванов'},
                                {key: 'region', label: 'Регион', placeholder: 'MSK'},
                                {key: 'status', label: 'Статус', placeholder: 'vip / regular / new'},
                            ]}
                            load={() => getUsers().then((data) => data.users)}
                            create={(form) => createUser({name: form.name, region: form.region, status: form.status})}
                            remove={(record) => deleteUser(record.id)}
                            onToast={showToast}
                        />
                    )}
                    {section === 'products' && (
                        <CrudSection<ProductRecord>
                            title="Товары"
                            subtitle="POST /create-product · GET /get-products · POST /delete-product"
                            primaryKey="name"
                            fields={[
                                {key: 'name', label: 'Название', placeholder: 'Кофе 250 г'},
                                {key: 'category', label: 'Категория', placeholder: 'coffee'},
                                {key: 'price', label: 'Цена', type: 'number', placeholder: '0'},
                                {key: 'card_price', label: 'Цена по карте', type: 'number', placeholder: '0'},
                            ]}
                            load={() => getProducts().then((data) => data.products)}
                            create={(form) => createProduct({
                                name: form.name,
                                category: form.category,
                                price: Number(form.price) || 0,
                                card_price: Number(form.card_price) || 0,
                            })}
                            remove={(record) => deleteProduct(record.id)}
                            onToast={showToast}
                        />
                    )}
                    {section === 'calc' && <CalcSection onToast={showToast} />}
                    {section === 'tests' && <TestsSection onToast={showToast} />}
                    {section === 'seed' && <SeedSection onToast={showToast} />}
                </div>
            </main>

            {toast && <div className="sales-toast"><Txt size="xs" tone="onAccent">{toast}</Txt></div>}
        </div>
    )
}
