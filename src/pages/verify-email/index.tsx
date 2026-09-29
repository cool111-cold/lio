import { CSSProperties, SubmitEvent, useEffect, useRef, useState } from "react"
import { PageComponent, Text, Button, Input } from "../../components"
import '../get-qr-admin/login.css'
import { API_BASE_URL } from '../../config'

const ADMIN_TOKEN_KEY = 'qr_admin_token'
const PENDING_MAIL_KEY = 'pending_verify_mail'

// переход на страницу подтверждения: письмо уйдёт на переданную почту
export const startMailVerification = (mail: string) => {
    sessionStorage.setItem(PENDING_MAIL_KEY, mail)
    window.location.assign('/verify-email')
}

const themeVars = {
    '--lio-text': '#f9f9f9',
    '--lio-input-bg': 'rgba(255, 255, 255, 0.05)',
} as unknown as CSSProperties

const extractErrorDetail = async (res: Response): Promise<string | null> => {
    try {
        const data = await res.json()
        return typeof data?.detail === 'string' ? data.detail : null
    } catch {
        return null
    }
}

const goToAdmin = () => window.location.replace('/admin')

type Status = 'loading' | 'idle' | 'sending' | 'sent' | 'verifying' | 'error'

export const VerifyEmailPage = () => {
    const verifyToken = new URLSearchParams(window.location.search).get('token')
    const authToken = localStorage.getItem(ADMIN_TOKEN_KEY)
    const authHeaders: Record<string, string> = authToken ? {Authorization: `Bearer ${authToken}`} : {}

    const [status, setStatus] = useState<Status>(verifyToken ? 'verifying' : 'loading')
    const [mail, setMail] = useState('')
    const [confirmedMail, setConfirmedMail] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const started = useRef(false)

    const unauthorized = () => {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        goToAdmin()
    }

    const sendMail = async (address: string) => {
        setStatus('sending')
        setError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/update-mail?mail=${encodeURIComponent(address)}`, {
                method: 'POST',
                headers: authHeaders,
            })
            if (res.status === 401) return unauthorized()
            if (!res.ok) throw new Error((await extractErrorDetail(res)) ?? '')
            setStatus('sent')
        } catch (e) {
            setError((e as Error).message || 'Не удалось отправить письмо')
            setStatus('error')
        }
    }

    const verify = async (token: string) => {
        setStatus('verifying')
        setError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`, {method: 'POST', headers: authHeaders})
            if (!res.ok) throw new Error((await extractErrorDetail(res)) ?? '')
            goToAdmin()
        } catch (e) {
            setError((e as Error).message || 'Ссылка недействительна или устарела')
            setStatus('error')
        }
    }

    const init = async () => {
        if (verifyToken) return verify(verifyToken)
        if (!authToken) return goToAdmin()

        const pendingMail = sessionStorage.getItem(PENDING_MAIL_KEY)
        if (pendingMail) {
            sessionStorage.removeItem(PENDING_MAIL_KEY)
            setMail(pendingMail)
            return sendMail(pendingMail)
        }

        try {
            const res = await fetch(`${API_BASE_URL}/get-my-store`, {headers: authHeaders})
            if (res.status === 401) return unauthorized()
            if (!res.ok) throw new Error('failed')
            // почта сохраняется только после подтверждения, повторно её не шлём
            const {mail: currentMail} = await res.json()
            setConfirmedMail(currentMail ?? null)
            setStatus('idle')
        } catch {
            setError('Не удалось загрузить данные')
            setStatus('idle')
        }
    }

    useEffect(() => {
        // защита от двойного вызова в StrictMode, чтобы не слать два письма
        if (started.current) return
        started.current = true
        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSubmit = (e: SubmitEvent) => {
        e.preventDefault()
        if (!mail) {
            setError('Укажите почту')
            return
        }
        sendMail(mail)
    }

    const busy = status === 'loading' || status === 'sending' || status === 'verifying'

    return (
        <PageComponent>
            <div className="admin-login-card" style={themeVars}>
                <Text size="l" color="white">Подтверждение почты</Text>

                {verifyToken ? (
                    <>
                        {status === 'verifying' && <Text size="s" color="lightGray">Проверяем ссылку…</Text>}
                        {error && <Text size="xs" color="accent">{error}</Text>}
                        {status === 'error' && (
                            <Button type="button" variant="solid" fullWidth textSize="m" onClick={goToAdmin}>
                                В админ-панель
                            </Button>
                        )}
                    </>
                ) : (
                    <form className="admin-login-form" onSubmit={handleSubmit}>
                        {status === 'sent' && (
                            <Text size="s" color="lightGray">{`Мы отправили письмо на ${mail}. Перейдите по ссылке из письма, чтобы подтвердить почту.`}</Text>
                        )}
                        {status === 'idle' && confirmedMail && (
                            <Text size="s" color="lightGray">{`Почта ${confirmedMail} уже подтверждена. Чтобы сменить её, укажите новую.`}</Text>
                        )}
                        <Input
                            label="Почта"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            value={mail}
                            onChange={(e) => setMail(e.target.value)}
                        />
                        {error && <Text size="xs" color="accent">{error}</Text>}
                        <Button type="submit" variant="solid" fullWidth textSize="m" disabled={busy}>
                            {busy ? 'Подождите…' : status === 'sent' || status === 'error' ? 'Отправить ещё раз' : 'Отправить письмо'}
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
