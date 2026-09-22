import { API_BASE_URL } from '../config'

export const resolveAssetUrl = (path: string | null | undefined): string => {
    if (!path) return ''
    if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
