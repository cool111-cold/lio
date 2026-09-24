import { useState } from "react"
import { Text, Button } from "../../components"
import { PAGE_SIZE } from "./api"

interface PagerProps {
    offset: number;
    hasNext: boolean;
    loading: boolean;
    onChange: (offset: number) => void;
}

export const Pager = ({offset, hasNext, loading, onChange}: PagerProps) => {
    if (offset === 0 && !hasNext) return null

    return (
        <div className="crm-pager">
            <Button variant="ghost" textSize="s" textColor="lightGray" disabled={loading || offset === 0} onClick={() => onChange(Math.max(0, offset - PAGE_SIZE))}>← Назад</Button>
            <Text size="xs" color="lightGray">{`Страница ${offset / PAGE_SIZE + 1}`}</Text>
            <Button variant="ghost" textSize="s" textColor="lightGray" disabled={loading || !hasNext} onClick={() => onChange(offset + PAGE_SIZE)}>Вперёд →</Button>
        </div>
    )
}

interface ListStatusProps {
    loading: boolean;
    error: string | null;
    empty: boolean;
    emptyText: string;
}

export const ListStatus = ({loading, error, empty, emptyText}: ListStatusProps) => {
    if (loading) {
        return (
            <div className="crm-list-status">
                <span className="loader-spinner" />
            </div>
        )
    }
    if (error) return <Text size="xs" color="accent">{error}</Text>
    if (empty) return <Text size="s" color="lightGray">{emptyText}</Text>
    return null
}

interface ConfirmButtonProps {
    label: string;
    confirmLabel?: string;
    onConfirm: () => void;
    disabled?: boolean;
}

export const ConfirmButton = ({label, confirmLabel = 'Точно удалить', onConfirm, disabled}: ConfirmButtonProps) => {
    const [confirming, setConfirming] = useState(false)

    if (!confirming) {
        return (
            <button type="button" className="admin-edit-btn" disabled={disabled} onClick={() => setConfirming(true)}>
                <Text size="xs" color="lightGray">{label}</Text>
            </button>
        )
    }

    return (
        <div className="crm-confirm">
            <button type="button" className="admin-edit-btn" disabled={disabled} onClick={() => setConfirming(false)}>
                <Text size="xs" color="lightGray">Отмена</Text>
            </button>
            <button
                type="button"
                className="admin-edit-btn"
                disabled={disabled}
                onClick={() => {
                    setConfirming(false)
                    onConfirm()
                }}
            >
                <Text size="xs" color="accent">{confirmLabel}</Text>
            </button>
        </div>
    )
}
