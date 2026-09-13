import { createElement, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

/* ---- typography ------------------------------------------------------ */

type Tone = 'strong' | 'default' | 'dim' | 'faint' | 'accent' | 'danger' | 'onAccent' | 'ok'
type TxtSize = 'xs' | 's' | 'm' | 'l' | 'xl'

interface TxtProps {
    children: ReactNode;
    tone?: Tone;
    size?: TxtSize;
    block?: boolean;
    caps?: boolean;
}

export const Txt = ({children, tone = 'default', size = 's', block, caps}: TxtProps) =>
    createElement(
        block ? 'p' : 'span',
        {className: `jost sales-txt sales-txt-${size} sales-txt-${tone}${caps ? ' sales-txt-caps' : ''}`},
        children,
    )

/* ---- form controls ------------------------------------------------- */

export const Field = ({label, hint, children}: {label: string; hint?: string; children: ReactNode}) => (
    <label className="sales-field">
        <span className="sales-field-label">
            <Txt size="xs" tone="dim">{label}</Txt>
            {hint && <Txt size="xs" tone="faint">{hint}</Txt>}
        </span>
        {children}
    </label>
)

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label: string;
    hint?: string;
}

export const TextField = ({label, hint, className, ...rest}: TextFieldProps) => (
    <Field label={label} hint={hint}>
        <input className={`sales-input jost${className ? ` ${className}` : ''}`} {...rest} />
    </Field>
)

export const Toggle = ({checked, onChange, label}: {checked: boolean; onChange: (v: boolean) => void; label: string}) => (
    <button
        type="button"
        className={`sales-toggle${checked ? ' sales-toggle-on' : ''}`}
        onClick={() => onChange(!checked)}
    >
        <span className="sales-toggle-track"><span className="sales-toggle-thumb" /></span>
        <Txt size="xs" tone={checked ? 'strong' : 'dim'}>{label}</Txt>
    </button>
)

export const Textarea = ({className, ...rest}: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea className={`sales-textarea jost${className ? ` ${className}` : ''}`} spellCheck={false} {...rest} />
)

/* ---- datetime helpers -------------------------------------------------- */

/** ISO 8601 -> значение для <input type="datetime-local"> (в локальной зоне). */
export const isoToLocalInput = (iso?: string): string => {
    if (!iso) return ''
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Значение <input type="datetime-local"> -> ISO 8601. */
export const localInputToIso = (local: string): string => {
    if (!local) return ''
    const date = new Date(local)
    return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}
