import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from '../../config'

export const PAGE_SIZE = 20

export type CrmStatus = 'user' | 'admin'

export interface CrmUser {
    id: number;
    login: string;
    status: CrmStatus;
}

export type CrmRequest = (path: string, init?: RequestInit) => Promise<Response | null>

export const extractErrorDetail = async (res: Response): Promise<string | null> => {
    try {
        const data = await res.json()
        return typeof data?.detail === 'string' ? data.detail : null
    } catch {
        return null
    }
}

// Бэкенд отвечает 401 "Invalid rules" на нехватку прав — это не протухший токен, разлогинивать не нужно
const FORBIDDEN_DETAIL = 'Invalid rules'

const ERROR_TRANSLATIONS: Record<string, string> = {
    'Login already taken': 'Логин уже занят',
    'CRM user not found': 'Пользователь не найден',
    'Cannot remove admin rights from yourself': 'Нельзя снять права администратора с себя',
    'Cannot delete yourself': 'Нельзя удалить себя',
    'Admin rights required': 'Нужны права администратора',
    [FORBIDDEN_DETAIL]: 'Недостаточно прав',
    'Base link not found': 'Базовая ссылка не найдена',
    'Code not found': 'Карта не найдена',
}

export const translateError = (detail: string | null, fallback: string) =>
    detail ? ERROR_TRANSLATIONS[detail] ?? detail : fallback

export const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback

export const ensureOk = async (res: Response, fallback: string) => {
    if (!res.ok) throw new Error(translateError(await extractErrorDetail(res), fallback))
    return res
}

export const useCrmRequest = (token: string, onUnauthorized?: () => void): CrmRequest =>
    useCallback(async (path: string, init: RequestInit = {}) => {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            ...init,
            headers: {...init.headers, Authorization: `Bearer ${token}`},
        })
        if (res.status === 401 && (await extractErrorDetail(res.clone())) !== FORBIDDEN_DETAIL) {
            onUnauthorized?.()
            return null
        }
        return res
    }, [token, onUnauthorized])

export const usePagedList = <T,>(request: CrmRequest, path: string, key: string) => {
    const [offset, setOffset] = useState(0)
    const [items, setItems] = useState<T[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const reload = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await request(`${path}${path.includes('?') ? '&' : '?'}offset=${offset}&limit=${PAGE_SIZE}`)
            if (!res) return
            await ensureOk(res, 'Не удалось загрузить данные')
            const data = await res.json()
            setItems(data[key] ?? [])
        } catch (err) {
            setError(getErrorMessage(err, 'Не удалось загрузить данные'))
        } finally {
            setLoading(false)
        }
    }, [request, path, key, offset])

    useEffect(() => {
        reload()
    }, [reload])

    // Бэкенд не отдаёт total, поэтому следующая страница есть, если текущая заполнена целиком
    return {items, loading, error, offset, setOffset, hasNext: items.length === PAGE_SIZE, reload}
}
