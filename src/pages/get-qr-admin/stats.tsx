import { useEffect, useMemo, useState } from "react"
import { PageComponent, Text } from "../../components"
import { resolveIcon } from "../../helpers"
import { API_BASE_URL } from '../../config'
import './style.css'
import './stats.css'

interface ApiMetric {
    link_id: number;
    datetime: string;
}

interface ApiStatsLink {
    id: number;
    label: string;
    icon: string | null;
}

type Period = 'day' | 'week' | 'month'

const PERIODS: {key: Period, label: string}[] = [
    {key: 'day', label: 'День'},
    {key: 'week', label: 'Неделя'},
    {key: 'month', label: 'Месяц'},
]

const HOUR_MS = 60 * 60 * 1000

interface Bucket {
    start: number;
    label: string;
    count: number;
}

// раньше этой даты статистики нет — дальше назад не листаем
const MIN_STATS_DATE = new Date(2026, 0, 1)

// offset: 0 — текущий день / неделя / месяц, -1 — предыдущий и т.д.; to не включается
const getRange = (period: Period, offset: number): {from: Date, to: Date} => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const day = now.getDate()

    if (period === 'day') {
        return {from: new Date(year, month, day + offset), to: new Date(year, month, day + offset + 1)}
    }
    if (period === 'week') {
        const monday = day - ((now.getDay() + 6) % 7) + offset * 7
        return {from: new Date(year, month, monday), to: new Date(year, month, monday + 7)}
    }
    return {from: new Date(year, month + offset, 1), to: new Date(year, month + offset + 1, 1)}
}

const formatDay = (date: Date) => date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})

const getRangeTitle = (period: Period, offset: number) => {
    const {from, to} = getRange(period, offset)

    if (period === 'day') {
        if (offset === 0) return 'Сегодня'
        if (offset === -1) return 'Вчера'
        return from.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'})
    }
    if (period === 'week') {
        const last = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 1)
        return `${formatDay(from)} – ${formatDay(last)}`
    }
    const title = from.toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})
    return title.charAt(0).toUpperCase() + title.slice(1)
}

// день — по часам, неделя и месяц — по дням
const buildBuckets = (period: Period, offset: number, metrics: ApiMetric[]): Bucket[] => {
    const {from, to} = getRange(period, offset)
    const buckets: Bucket[] = []

    if (period === 'day') {
        for (let hour = 0; hour < 24; hour++) {
            buckets.push({start: from.getTime() + hour * HOUR_MS, label: `${String(hour).padStart(2, '0')}:00`, count: 0})
        }
    } else {
        for (let date = new Date(from); date < to; date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)) {
            buckets.push({start: date.getTime(), label: formatDay(date), count: 0})
        }
    }

    metrics.forEach((metric) => {
        const time = new Date(metric.datetime).getTime()
        if (time >= to.getTime()) return
        for (let i = buckets.length - 1; i >= 0; i--) {
            if (time >= buckets[i].start) {
                buckets[i].count += 1
                break
            }
        }
    })

    return buckets
}

interface GetQrAdminStatsPageProps {
    token: string;
    onUnauthorized?: () => void;
}

export const GetQrAdminStatsPage = ({token, onUnauthorized}: GetQrAdminStatsPageProps) => {
    const [period, setPeriod] = useState<Period>('week')
    const [offset, setOffset] = useState(0)
    const [metrics, setMetrics] = useState<ApiMetric[]>([])
    const [links, setLinks] = useState<ApiStatsLink[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeBucket, setActiveBucket] = useState<number | null>(null)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError(null)
            setActiveBucket(null)
            try {
                const {from, to} = getRange(period, offset)
                const params = new URLSearchParams({date_from: from.toISOString(), date_to: to.toISOString()})
                const res = await fetch(`${API_BASE_URL}/all-metrics?${params.toString()}`, {headers: {Authorization: `Bearer ${token}`}})
                if (res.status === 401) {
                    onUnauthorized?.()
                    return
                }
                if (!res.ok) throw new Error('failed')
                const data = await res.json()
                if (cancelled) return
                setMetrics(Array.isArray(data.metrics) ? data.metrics : [])
                setLinks(Array.isArray(data.links) ? data.links : [])
            } catch {
                if (!cancelled) setError('Не удалось загрузить статистику')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period, offset, token])

    const buckets = useMemo(() => buildBuckets(period, offset, metrics), [period, offset, metrics])
    const maxBucket = Math.max(1, ...buckets.map((bucket) => bucket.count))

    const linkRows = useMemo(() => {
        const counts = new Map<number, number>()
        metrics.forEach((metric) => counts.set(metric.link_id, (counts.get(metric.link_id) ?? 0) + 1))
        return links
            .map((link) => ({...link, count: counts.get(link.id) ?? 0}))
            .sort((a, b) => b.count - a.count)
    }, [metrics, links])
    const maxLink = Math.max(1, ...linkRows.map((link) => link.count))

    const rangeTitle = getRangeTitle(period, offset)
    const canGoBack = getRange(period, offset - 1).to > MIN_STATS_DATE
    const active = activeBucket !== null ? buckets[activeBucket] : null

    return (
        <PageComponent center={false}>
            <div className="admin-scroll">
                <div className="admin-stats">
                    <div className="admin-stats-head">
                        <button type="button" className="admin-edit-btn" onClick={() => window.location.assign('/admin')}>
                            <Text size="xs" color="lightGray">← Назад</Text>
                        </button>
                        <Text size="l" color="white">Статистика</Text>
                    </div>

                    <div className="admin-stats-periods" role="group" aria-label="Период">
                        {PERIODS.map(({key, label}) => (
                            <button
                                key={key}
                                type="button"
                                className={`admin-stats-period${period === key ? ' admin-stats-period-active' : ''}`}
                                aria-pressed={period === key}
                                onClick={() => {setPeriod(key); setOffset(0)}}
                            >
                                <Text size="s" color={period === key ? 'white' : 'lightGray'}>{label}</Text>
                            </button>
                        ))}
                    </div>

                    <div className="admin-stats-nav">
                        <button type="button" className="admin-edit-btn" aria-label="Предыдущий период" onClick={() => setOffset(offset - 1)} disabled={!canGoBack}>
                            <Text size="xs" color="lightGray">←</Text>
                        </button>
                        <Text size="s" color="white">{rangeTitle}</Text>
                        <button type="button" className="admin-edit-btn" aria-label="Следующий период" onClick={() => setOffset(offset + 1)} disabled={offset >= 0}>
                            <Text size="xs" color="lightGray">→</Text>
                        </button>
                    </div>

                    {error && <Text size="s" color="accent">{error}</Text>}

                    {!error && (
                        <div className={`admin-stats-body${loading ? ' admin-stats-body-loading' : ''}`}>
                            <div className="admin-stats-panel">
                                <div className="admin-stats-panel-head">
                                    <Text size="xs" color="lightGray">{active ? active.label : 'Переходы'}</Text>
                                    <span className="admin-stats-total">{active ? active.count : metrics.length}</span>
                                </div>
                                <div className="admin-stats-chart" onMouseLeave={() => setActiveBucket(null)}>
                                    {buckets.map((bucket, i) => (
                                        <button
                                            key={bucket.start}
                                            type="button"
                                            className={`admin-stats-col${activeBucket === i ? ' admin-stats-col-active' : ''}`}
                                            aria-label={`${bucket.label}: ${bucket.count}`}
                                            onMouseEnter={() => setActiveBucket(i)}
                                            onFocus={() => setActiveBucket(i)}
                                            onBlur={() => setActiveBucket(null)}
                                            onClick={() => setActiveBucket(i)}
                                        >
                                            <span className="admin-stats-col-fill" style={{height: `${(bucket.count / maxBucket) * 100}%`}} />
                                        </button>
                                    ))}
                                </div>
                                <div className="admin-stats-axis">
                                    <span>{buckets[0].label}</span>
                                    <span>{buckets[Math.floor(buckets.length / 2)].label}</span>
                                    <span>{buckets[buckets.length - 1].label}</span>
                                </div>
                            </div>

                            <div className="admin-stats-panel">
                                <div className="admin-stats-panel-head">
                                    <Text size="xs" color="lightGray">По ссылкам</Text>
                                </div>
                                {linkRows.length === 0 && <Text size="s" color="lightGray">{loading ? 'Загрузка…' : 'Ссылок пока нет'}</Text>}
                                {linkRows.map((link) => (
                                    <div className="admin-stats-row" key={link.id} onClick={() => window.location.replace(link.link)}>
                                        <div className="admin-stats-row-top">
                                            <div className="admin-stats-row-label">
                                                <img className="admin-stats-row-icon" src={resolveIcon(link.icon)} alt="" />
                                                <Text size="s" color="white">{link.label}</Text>
                                            </div>
                                            <span className="admin-stats-count">{link.count}</span>
                                        </div>
                                        <div className="admin-stats-bar">
                                            <div className="admin-stats-bar-fill" style={{width: `${(link.count / maxLink) * 100}%`}} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageComponent>
    )
}
