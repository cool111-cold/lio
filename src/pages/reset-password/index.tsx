import { CSSProperties, SubmitEvent, useEffect, useState } from "react"
import { PageComponent, Text, Button, Input } from "../../components"
import '../get-qr-admin/login.css'
import { API_BASE_URL } from '../../config'

const themeVars = {
    '--lio-text': '#f9f9f9',
    '--lio-input-bg': 'rgba(255, 255, 255, 0.05)',
} as unknown as CSSProperties

export const MIN_PASSWORD_LENGTH = 6

const ERROR_MESSAGES: Record<string, string> = {
    'Invalid token': 'Ссылка недействительна',
    'Token expired': 'Срок действия ссылки истёк, запросите новую',
    'Invalid old password': 'Неверный текущий пароль',
}

// переводит detail из ответа бэкенда в понятный текст
export const extractPasswordError = async (res: Response, fallback: string): Promise<string> => {
    try {
        const data = await res.json()
        const detail = typeof data?.detail === 'string' ? data.detail : null
        if (!detail) return fallback
        const retry = detail.match(/^Email already sent, retry in (\d+) seconds$/)
        if (retry) return `Письмо уже отправлено, повторить можно через ${retry[1]} сек.`
        return ERROR_MESSAGES[detail] ?? fallback
    } catch {
        return fallback
    }
}

const ADMIN_TOKEN_KEY = 'qr_admin_token'

const goToAdmin = () => window.location.replace('/admin')

export const ResetPasswordPage = () => {
    const resetToken = new URLSearchParams(window.location.search).get('token')
    const isAuthorized = Boolean(localStorage.getItem(ADMIN_TOKEN_KEY))

    const [mail, setMail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // авторизованному пользователю подставляем почту из профиля
    useEffect(() => {
        const authToken = localStorage.getItem(ADMIN_TOKEN_KEY)
        if (resetToken || !authToken) return
        fetch(`${API_BASE_URL}/get-my-store`, {headers: {Authorization: `Bearer ${authToken}`}})
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.mail) setMail((prev) => prev || data.mail)
            })
            .catch(() => {})
    }, [resetToken])

    const requestReset = async (e: SubmitEvent) => {
        e.preventDefault()
        setError(null)
        if (!mail) {
            setError('Укажите почту')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/reset-password-request?mail=${encodeURIComponent(mail)}`, {method: 'POST'})
            if (!res.ok) throw new Error(await extractPasswordError(res, 'Не удалось отправить письмо'))
            setSent(true)
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : 'Не удалось отправить письмо')
        } finally {
            setLoading(false)
        }
    }

    const resetPassword = async (e: SubmitEvent) => {
        e.preventDefault()
        setError(null)
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`)
            return
        }
        if (password !== confirmPassword) {
            setError('Пароли не совпадают')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({token: resetToken, new_password: password}),
            })
            if (!res.ok) throw new Error(await extractPasswordError(res, 'Не удалось сменить пароль'))
            setDone(true)
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : 'Не удалось сменить пароль')
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageComponent>
            <div className="admin-login-card" style={themeVars}>
                <Text size="l" color="white">{resetToken ? 'Новый пароль' : 'Восстановление пароля'}</Text>

                {resetToken ? (
                    done ? (
                        <>
                            <Text size="s" color="lightGray">
                                {isAuthorized ? 'Пароль изменён. Можете вернуться в профиль.' : 'Пароль изменён. Войдите с новым паролем.'}
                            </Text>
                            <Button type="button" variant="solid" fullWidth textSize="m" onClick={goToAdmin}>
                                {isAuthorized ? 'Вернуться в профиль' : 'Войти'}
                            </Button>
                        </>
                    ) : (
                        <form className="admin-login-form" onSubmit={resetPassword}>
                            <Input label="Новый пароль" placeholder={`Минимум ${MIN_PASSWORD_LENGTH} символов`} secureToggle autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <Input label="Повтор пароля" placeholder="Повторите пароль" secureToggle autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            {error && <Text size="xs" color="accent">{error}</Text>}
                            <Button type="submit" variant="solid" fullWidth textSize="m" disabled={loading}>
                                {loading ? 'Подождите…' : 'Сохранить пароль'}
                            </Button>
                            {error && (
                                <Button type="button" variant="ghost" fullWidth textSize="s" textColor="lightGray" onClick={() => window.location.assign('/reset-password')}>
                                    Запросить новую ссылку
                                </Button>
                            )}
                        </form>
                    )
                ) : (
                    <form className="admin-login-form" onSubmit={requestReset}>
                        {sent ? (
                            <Text size="s" color="lightGray">{`Если почта ${mail} привязана к аккаунту, мы отправили на неё ссылку для смены пароля.`}</Text>
                        ) : (
                            <Text size="s" color="lightGray">Укажите почту, привязанную к аккаунту — пришлём ссылку для смены пароля.</Text>
                        )}
                        <Input label="Почта" type="email" placeholder="you@example.com" autoComplete="email" value={mail} onChange={(e) => setMail(e.target.value)} />
                        {error && <Text size="xs" color="accent">{error}</Text>}
                        <Button type="submit" variant="solid" fullWidth textSize="m" disabled={loading}>
                            {loading ? 'Подождите…' : sent ? 'Отправить ещё раз' : 'Отправить ссылку'}
                        </Button>
                        <Button type="button" variant="ghost" fullWidth textSize="s" textColor="lightGray" onClick={goToAdmin}>
                            Назад
                        </Button>
                    </form>
                )}
            </div>
        </PageComponent>
    )
}
