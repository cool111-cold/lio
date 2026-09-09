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

export const IconPlus = ({size = 16}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M12 5v14M5 12h14" />
    </svg>
)

export const IconTrash = ({size = 15}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
)

export const IconPencil = ({size = 15}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
)

export const IconClose = ({size = 16}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M18 6 6 18M6 6l12 12" />
    </svg>
)

export const IconChevron = ({size = 14}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="m6 9 6 6 6-6" />
    </svg>
)

export const IconTag = ({size = 15}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V4a1 1 0 0 1 1-1h7.8a2 2 0 0 1 1.4.6l7.6 7.6a2 2 0 0 1 0 2.8Z" />
        <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
)

export const IconUsers = ({size = 15}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
    </svg>
)

export const IconBox = ({size = 15}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="m21 8-9-5-9 5v8l9 5 9-5V8ZM3.3 7 12 12l8.7-5M12 22V12" />
    </svg>
)

export const IconCalc = ({size = 15}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14v4M8 18h4" />
    </svg>
)

export const IconDatabase = ({size = 15}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </svg>
)

export const IconActivity = ({size = 15}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="M3 12h4l3 8 4-16 3 8h4" />
    </svg>
)

export const IconLayers = ({size = 16}: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
        <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17l9 5 9-5" />
    </svg>
)
