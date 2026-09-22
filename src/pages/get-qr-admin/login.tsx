import { ChangeEvent, CSSProperties, SubmitEvent, useState } from "react"
import { PageComponent, Text, Button, Input } from "../../components"
import './login.css'
import { API_BASE_URL } from '../../config'

type Mode = 'login' | 'register'

interface LoginFormState {
    login: string;
    password: string;
}

interface RegisterFormState {
    mail: string;
    login: string;
    password: string;
    confirmPassword: string;
}

const INITIAL_LOGIN: LoginFormState = {login: '', password: ''}
const INITIAL_REGISTER: RegisterFormState = {mail: '', login: '', password: '', confirmPassword: ''}


const getCardFromPath = (): string | null => {
    const match = window.location.pathname.match(/^\/admin\/([^/]+)/)
    return match ? decodeURIComponent(match[1]) : null
}

const themeVars = {
    '--lio-text': '#f9f9f9',
    '--lio-input-bg': 'rgba(255, 255, 255, 0.05)',
} as unknown as CSSProperties

interface GetQrAdminLoginPageProps {
    onAuthenticated?: (token: string) => void;
}

export const GetQrAdminLoginPage = ({onAuthenticated}: GetQrAdminLoginPageProps = {}) => {
    const [mode, setMode] = useState<Mode>('login')
    const [loginForm, setLoginForm] = useState<LoginFormState>(INITIAL_LOGIN)
    const [registerForm, setRegisterForm] = useState<RegisterFormState>(INITIAL_REGISTER)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const switchMode = (nextMode: Mode) => {
        setMode(nextMode)
        setError(null)
    }

    const updateLoginField = (field: keyof LoginFormState) => (e: ChangeEvent<HTMLInputElement>) => {
        setLoginForm((prev) => ({...prev, [field]: e.target.value}))
    }

    const updateRegisterField = (field: keyof RegisterFormState) => (e: ChangeEvent<HTMLInputElement>) => {
        setRegisterForm((prev) => ({...prev, [field]: e.target.value}))
    }

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault()
        setError(null)

        if (mode === 'login') {
            if (!loginForm.login || !loginForm.password) {
                setError('Заполните логин и пароль')
                return
            }
        } else {
            if (!registerForm.login || !registerForm.password) {
                setError('Заполните логин и пароль')
                return
            }
            if (registerForm.password !== registerForm.confirmPassword) {
                setError('Пароли не совпадают')
                return
            }
        }

        setLoading(true)
        try {
            const card = getCardFromPath()
            const query = card ? `?card=${encodeURIComponent(card)}` : ''
            const response = await fetch(`${API_BASE_URL}/${mode}${query}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(
                    mode === 'login'
                        ? {login: loginForm.login, password: loginForm.password}
                        : {mail: registerForm.mail || undefined, login: registerForm.login, password: registerForm.password}
                ),
            })

            if (!response.ok) {
                throw new Error('Request failed')
            }

            const data = await response.json()
            onAuthenticated?.(data.access_token)
        } catch {
            setError(mode === 'login' ? 'Неверный логин или пароль' : getCardFromPath() ? 'Не удалось зарегистрироваться' : 'Пожалуйста, приобретите карту для регистрации или отсканируйте уже имеющуюся')
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageComponent>
            <div className="admin-login-card" style={themeVars}>
                <Text size="l" color="white">Админ-панель</Text>

                <div className="admin-login-tabs">
                    <div className={`admin-login-tab${mode === 'login' ? ' admin-login-tab-active' : ''}`}>
                        <Button variant="ghost" fullWidth textSize="s" textColor={mode === 'login' ? 'white' : 'lightGray'} onClick={() => switchMode('login')}>Вход</Button>
                    </div>
                    <div className={`admin-login-tab${mode === 'register' ? ' admin-login-tab-active' : ''}`}>
                        <Button variant="ghost" fullWidth textSize="s" textColor={mode === 'register' ? 'white' : 'lightGray'} onClick={() => switchMode('register')}>Регистрация</Button>
                    </div>
                </div>

                <form className="admin-login-form" onSubmit={handleSubmit}>
                    {mode === 'login' ? (
                        <>
                            <Input label="Логин" placeholder="Ваш логин" autoComplete="username" value={loginForm.login} onChange={updateLoginField('login')} />
                            <Input label="Пароль" placeholder="Пароль" secureToggle autoComplete="current-password" value={loginForm.password} onChange={updateLoginField('password')} />
                        </>
                    ) : (
                        <>
                            <Input label="Почта (необязательно)" type="email" placeholder="you@example.com" autoComplete="email" value={registerForm.mail} onChange={updateRegisterField('mail')} />
                            <Input label="Логин" placeholder="Придумайте логин" autoComplete="username" value={registerForm.login} onChange={updateRegisterField('login')} />
                            <Input label="Пароль" placeholder="Минимум 6 символов" secureToggle autoComplete="new-password" value={registerForm.password} onChange={updateRegisterField('password')} />
                            <Input label="Повтор пароля" placeholder="Повторите пароль" secureToggle autoComplete="new-password" value={registerForm.confirmPassword} onChange={updateRegisterField('confirmPassword')} />
                        </>
                    )}

                    {error && <Text size="xs" color="accent">{error}</Text>}

                    <Button type="submit" variant="solid" fullWidth textSize="m" disabled={loading}>
                        {loading ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
                    </Button>
                </form>
            </div>
        </PageComponent>
    )
}
