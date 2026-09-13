import { useMemo, useState } from 'react'
import { Txt, Textarea } from './controls'
import { IconClose, IconPlus } from './icons'
import type { AnyDict } from '../api'

interface Entry { k: string; v: string }
type Rows = Entry[][]

const valueToString = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

const coerce = (raw: string): unknown => {
    const value = raw.trim()
    if (value === '') return ''
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === 'null') return null
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
    if (/^[[{"]/.test(value)) {
        try {
            return JSON.parse(value)
        } catch {
            return raw
        }
    }
    return raw
}

const toRows = (dicts: AnyDict[]): Rows =>
    dicts.map((dict) => Object.entries(dict).map(([k, v]) => ({k, v: valueToString(v)})))

const serialize = (rows: Rows): AnyDict[] =>
    rows.map((row) => {
        const dict: AnyDict = {}
        row.forEach(({k, v}) => {
            if (k.trim()) dict[k.trim()] = coerce(v)
        })
        return dict
    })

interface DictListEditorProps {
    value: AnyDict[];
    onChange: (next: AnyDict[]) => void;
    itemLabel?: string;
    addLabel?: string;
    emptyHint?: string;
    newItem?: () => AnyDict;
}

export const DictListEditor = ({
    value,
    onChange,
    itemLabel = 'Условие',
    addLabel = 'Добавить условие',
    emptyHint = 'Условий нет — скидка применяется всегда',
    newItem,
}: DictListEditorProps) => {
    const [rows, setRows] = useState<Rows>(() => toRows(value))
    const [rawMode, setRawMode] = useState(false)
    const [rawText, setRawText] = useState(() => JSON.stringify(value, null, 2))
    const [rawError, setRawError] = useState<string | null>(null)

    const commit = (next: Rows) => {
        setRows(next)
        onChange(serialize(next))
    }

    const addItem = () => {
        const seeded = newItem ? Object.entries(newItem()).map(([k, v]) => ({k, v: valueToString(v)})) : []
        commit([...rows, seeded.length ? seeded : [{k: '', v: ''}]])
    }

    const removeItem = (index: number) => commit(rows.filter((_, i) => i !== index))

    const updateEntry = (item: number, entry: number, patch: Partial<Entry>) => {
        commit(rows.map((row, i) =>
            i === item ? row.map((e, j) => (j === entry ? {...e, ...patch} : e)) : row
        ))
    }

    const addEntry = (item: number) =>
        commit(rows.map((row, i) => (i === item ? [...row, {k: '', v: ''}] : row)))

    const removeEntry = (item: number, entry: number) =>
        commit(rows.map((row, i) => (i === item ? row.filter((_, j) => j !== entry) : row)))

    const enterRawMode = () => {
        setRawText(JSON.stringify(serialize(rows), null, 2))
        setRawError(null)
        setRawMode(true)
    }

    const applyRaw = (text: string) => {
        setRawText(text)
        try {
            const parsed = JSON.parse(text)
            if (!Array.isArray(parsed)) throw new Error('Ожидается массив объектов')
            setRawError(null)
            setRows(toRows(parsed as AnyDict[]))
            onChange(parsed as AnyDict[])
        } catch (error) {
            setRawError(error instanceof Error ? error.message : 'Некорректный JSON')
        }
    }

    const preview = useMemo(() => JSON.stringify(serialize(rows)), [rows])

    return (
        <div className="sales-dict">
            <div className="sales-dict-head">
                <Txt size="xs" tone="faint">{`${rows.length} шт.`}</Txt>
                <button
                    type="button"
                    className="sales-link"
                    onClick={() => (rawMode ? setRawMode(false) : enterRawMode())}
                >
                    <Txt size="xs" tone="accent">{rawMode ? 'Конструктор' : 'JSON'}</Txt>
                </button>
            </div>

            {rawMode ? (
                <>
                    <Textarea
                        rows={Math.min(16, Math.max(4, rawText.split('\n').length))}
                        value={rawText}
                        onChange={(e) => applyRaw(e.target.value)}
                    />
                    {rawError
                        ? <Txt size="xs" tone="danger">{rawError}</Txt>
                        : <Txt size="xs" tone="faint">{'Массив объектов, значения — любой JSON'}</Txt>}
                </>
            ) : (
                <>
                    {rows.length === 0 && (
                        <div className="sales-dict-empty">
                            <Txt size="xs" tone="faint">{emptyHint}</Txt>
                        </div>
                    )}

                    {rows.map((row, itemIndex) => (
                        <div className="sales-dict-item" key={itemIndex}>
                            <div className="sales-dict-item-head">
                                <Txt size="xs" tone="dim">{`${itemLabel} ${itemIndex + 1}`}</Txt>
                                <button type="button" className="sales-icon-btn" onClick={() => removeItem(itemIndex)}>
                                    <IconClose size={13} />
                                </button>
                            </div>

                            {row.map((entry, entryIndex) => (
                                <div className="sales-dict-row" key={entryIndex}>
                                    <input
                                        className="sales-input jost sales-dict-key"
                                        placeholder="поле"
                                        value={entry.k}
                                        onChange={(e) => updateEntry(itemIndex, entryIndex, {k: e.target.value})}
                                    />
                                    <input
                                        className="sales-input jost"
                                        placeholder="значение"
                                        value={entry.v}
                                        onChange={(e) => updateEntry(itemIndex, entryIndex, {v: e.target.value})}
                                    />
                                    <button
                                        type="button"
                                        className="sales-icon-btn"
                                        onClick={() => removeEntry(itemIndex, entryIndex)}
                                    >
                                        <IconClose size={13} />
                                    </button>
                                </div>
                            ))}

                            <button type="button" className="sales-link" onClick={() => addEntry(itemIndex)}>
                                <IconPlus size={12} />
                                <Txt size="xs" tone="accent">{'поле'}</Txt>
                            </button>
                        </div>
                    ))}

                    <button type="button" className="sales-btn-dashed" onClick={addItem}>
                        <IconPlus size={13} />
                        <Txt size="xs" tone="dim">{addLabel}</Txt>
                    </button>

                    {rows.length > 0 && <code className="sales-dict-preview jost">{preview}</code>}
                </>
            )}
        </div>
    )
}
