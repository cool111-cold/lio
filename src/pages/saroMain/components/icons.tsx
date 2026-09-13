interface IconProps {
    size?: number;
}

const base = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
}

export const IconClose = ({size = 16}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M18 6 6 18M6 6l12 12" />
    </svg>
)

export const IconChevronDown = ({size = 14}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="m6 9 6 6 6-6" />
    </svg>
)

export const IconLink = ({size = 16}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />
    </svg>
)

export const IconThumbUp = ({size = 14}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Zm0 0 4.5-7a2 2 0 0 1 3.5 1.5V9h4.2a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 18 20H9a2 2 0 0 1-2-2V10Z" />
    </svg>
)

export const IconThumbDown = ({size = 14}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{transform: 'rotate(180deg)'}} {...base}>
        <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Zm0 0 4.5-7a2 2 0 0 1 3.5 1.5V9h4.2a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 18 20H9a2 2 0 0 1-2-2V10Z" />
    </svg>
)

export const IconCopy = ({size = 14}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
)

export const IconPlus = ({size = 16}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M12 5v14M5 12h14" />
    </svg>
)

export const IconFilter = ({size = 16}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M4 5h16M7 12h10M10 19h4" />
    </svg>
)

export const IconMic = ({size = 16}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
)

export const IconSend = ({size = 16}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="m3 11 18-8-8 18-2.5-7L3 11Z" />
    </svg>
)
