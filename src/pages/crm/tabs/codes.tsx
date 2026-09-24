import { useState } from "react"
import { Text, Button } from "../../../components"
import { CrmRequest, PAGE_SIZE, ensureOk, getErrorMessage, usePagedList } from "../api"
import { ConfirmButton, ListStatus, Pager } from "../components"

type CodeFilter = 'all' | 'free' | 'busy'

const FILTERS: {key: CodeFilter; label: string; query: string}[] = [
    {key: 'all', label: 'Все', query: ''},
    {key: 'free', label: 'Свободные', query: '?onlyFree=true'},
    {key: 'busy', label: 'Занятые', query: '?onlyBusy=true'},
]

const getCardUrl = (code: string) => `${window.location.origin}/cards/${encodeURIComponent(code)}`

// navigator.clipboard доступен только в secure context (https или localhost), для остального — fallback через textarea
const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (!copied) throw new Error('copy failed')
}

interface CrmCode {
    id: number;
    code: string;
    store_id: number | null;
}

export const CodesTab = ({request}: {request: CrmRequest}) => {
    const [filter, setFilter] = useState<CodeFilter>('all')
    const filterQuery = FILTERS.find((f) => f.key === filter)?.query ?? ''
    const {items, loading, error, offset, setOffset, hasNext, reload} = usePagedList<CrmCode>(request, `/crm/get-codes${filterQuery}`, 'codes')
    const [busy, setBusy] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<number | null>(null)

    const copyCardUrl = async (code: CrmCode) => {
        setActionError(null)
        try {
            await copyToClipboard(getCardUrl(code.code))
            setCopiedId(code.id)
            setTimeout(() => setCopiedId((id) => (id === code.id ? null : id)), 1500)
        } catch {
            setActionError('Не удалось скопировать ссылку')
        }
    }

    const createCode = async () => {
        setBusy(true)
        setActionError(null)
        try {
            const res = await request('/crm/create-code', {method: 'POST'})
            if (!res) return
            await ensureOk(res, 'Не удалось создать карту')
            await reload()
        } catch (err) {
            setActionError(getErrorMessage(err, 'Не удалось создать карту'))
        } finally {
            setBusy(false)
        }
    }

    const deleteCode = async (codeId: number) => {
        setBusy(true)
        setActionError(null)
        try {
            const res = await request(`/crm/delete-code?code_id=${codeId}`, {method: 'DELETE'})
            if (!res) return
            await ensureOk(res, 'Не удалось удалить карту')
            if (items.length === 1 && offset > 0) setOffset(offset - PAGE_SIZE)
            else await reload()
        } catch (err) {
            setActionError(getErrorMessage(err, 'Не удалось удалить карту'))
        } finally {
            setBusy(false)
        }
    }

    const selectFilter = (key: CodeFilter) => {
        setFilter(key)
        setOffset(0)
    }

    return (
        <div className="crm-list">
            <button type="button" className="link-row admin-add-row" onClick={createCode} disabled={busy}>
                <span className="link-icon admin-add-icon">+</span>
                <Text size="m" color="lightGray">{busy ? 'Подождите…' : 'Создать карту'}</Text>
            </button>

            {actionError && <Text size="xs" color="accent">{actionError}</Text>}

            <div className="admin-login-tabs">
                {FILTERS.map(({key, label}) => (
                    <div key={key} className={`admin-login-tab${filter === key ? ' admin-login-tab-active' : ''}`}>
                        <Button variant="ghost" fullWidth textSize="s" textColor={filter === key ? 'white' : 'lightGray'} onClick={() => selectFilter(key)}>{label}</Button>
                    </div>
                ))}
            </div>

            <ListStatus loading={loading} error={error} empty={items.length === 0} emptyText="Карт нет" />

            {!loading && items.map((code) => (
                <div className="link-row admin-link-row" key={code.id}>
                    <div className="admin-link-info">
                        <Text size="m" color="white">{code.code}</Text>
                        <div className="crm-code-meta">
                            <span className="admin-link-metric">{`#${code.id}`}</span>
                            {code.store_id ? (
                                <a
                                    className="crm-code-status crm-code-status-busy"
                                    href={`/${code.store_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {`Занята · страница #${code.store_id}`}
                                </a>
                            ) : (
                                <span className="crm-code-status crm-code-status-free">Свободна</span>
                            )}
                        </div>
                    </div>
                    <div className="crm-row-actions">
                        <button type="button" className="admin-edit-btn" title={getCardUrl(code.code)} onClick={() => copyCardUrl(code)}>
                            <Text size="xs" color={copiedId === code.id ? 'accent' : 'lightGray'}>{copiedId === code.id ? 'Скопировано' : 'Скопировать'}</Text>
                        </button>
                        <ConfirmButton label="Удалить" disabled={busy} onConfirm={() => deleteCode(code.id)} />
                    </div>
                </div>
            ))}

            <Pager offset={offset} hasNext={hasNext} loading={loading} onChange={setOffset} />
        </div>
    )
}
