import { ChangeEvent, CSSProperties, SubmitEvent, useMemo, useRef, useState } from "react"
import { PageComponent, Text, Button, Input } from "../../components"
import { AsciiBackground } from "./components/AsciiBackground"
import './style.css'

type Mode = 'login' | 'register'
type Theme = 'light' | 'dark'

interface FormState {
    name: string;
    password: string;
    confirmPassword: string;
}

const INITIAL_FORM: FormState = { name: '', password: '', confirmPassword: '' }

const API_BASE_URL = 'http://localhost:8000'

const ThemeSwitch = ({theme, onToggle}: {theme: Theme, onToggle: () => void}) => {
    return (
        <div className="theme-switch" onClick={onToggle}>
            <div className={`theme-switch-track theme-switch-track-${theme}`}>
                <div className="theme-switch-thumb" />
            </div>
            <Text size="xs" color="secondary">{theme === 'light' ? 'Светлая' : 'Тёмная'}</Text>
        </div>
    )
}

interface SaroLoginPageProps {
    onAuthenticated?: (token: string) => void;
}

export const SaroLoginPage = ({onAuthenticated}: SaroLoginPageProps) => {
    const [theme, setTheme] = useState<Theme>('dark')
    const [mode, setMode] = useState<Mode>('login')
    const [form, setForm] = useState<FormState>(INITIAL_FORM)
    const [error, setError] = useState<string | null>(null)
    const [info, setInfo] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const themeVars = useMemo(() => ({
        '--lio-bg': theme === 'light' ? '#f7f7f7' : '#1e1e1e',
        '--lio-text': theme === 'light' ? '#1e1e1e' : '#f7f7f7',
        '--lio-input-bg': theme === 'light' ? 'rgba(30, 30, 30, 0.03)' : 'rgba(247, 247, 247, 0.05)',
    }) as unknown as CSSProperties, [theme])

    const updateField = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({...prev, [field]: e.target.value}))
    }

    const switchMode = (nextMode: Mode) => {
        setMode(nextMode)
        setError(null)
        setInfo(null)
    }

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault()

        if (!form.name || !form.password) {
            setError('Заполните имя и пароль')
            return
        }

        if (mode === 'register' && form.password !== form.confirmPassword) {
            setError('Пароли не совпадают')
            return
        }

        setError(null)
        setInfo(null)
        setLoading(true)

        try {
            const response = await fetch(`${API_BASE_URL}/${mode === 'login' ? 'login' : 'register'}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: form.name, password: form.password}),
            })

            if (!response.ok) {
                throw new Error('Request failed')
            }

            if (mode === 'login') {
                const data = await response.json()
                onAuthenticated?.(data.access_token)
            } else {
                setForm({name: form.name, password: '', confirmPassword: ''})
                switchMode('login')
                setInfo('Аккаунт создан, теперь войдите')
            }
        } catch {
            setError(mode === 'login' ? 'Не удалось войти' : 'Не удалось зарегистрироваться')
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageComponent center={false}>
            <div className="saro-login" style={themeVars}>
                <AsciiBackground color={theme === 'light' ? '#000000' : '#ffffff'} avoidRef={cardRef} />

                {/* <ThemeSwitch theme={theme} onToggle={() => setTheme((t) => t === 'light' ? 'dark' : 'light')} /> */}

                <div className="saro-login-card" ref={cardRef}>
                    <Text size="xxl" color="primary">{'saro'}</Text>
                    {/* <Text size="xs" color="secondary">{mode === 'login' ? 'Рады видеть снова' : 'Создайте новый аккаунт'}</Text> */}

                    <div className="saro-login-tabs">
                        <div className={`saro-login-tab${mode === 'login' ? ' saro-login-tab-active' : ''}`}>
                            <Button variant="ghost" fullWidth textSize="m" textColor={mode === 'login' ? 'primary' : 'secondary'} onClick={() => switchMode('login')}>{'Вход'}</Button>
                        </div>
                        <div className={`saro-login-tab${mode === 'register' ? ' saro-login-tab-active' : ''}`}>
                            <Button variant="ghost" fullWidth textSize="m" textColor={mode === 'register' ? 'primary' : 'secondary'} onClick={() => switchMode('register')}>{'Регистрация'}</Button>
                        </div>
                    </div>

                    <form className="saro-login-form" onSubmit={handleSubmit}>
                        <Input label="Имя" placeholder="Как вас зовут" autoComplete="name" value={form.name} onChange={updateField('name')} />
                        {/* <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={updateField('email')} /> */}
                        <Input label="Пароль" placeholder="Минимум 6 символов" secureToggle autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={updateField('password')} />
                        {mode === 'register' && (
                            <Input label="Повтор пароля" placeholder="Повторите пароль" secureToggle autoComplete="new-password" value={form.confirmPassword} onChange={updateField('confirmPassword')} />
                        )}

                        {/* {mode === 'login' && (
                            <div className="saro-login-forgot">
                                <Text size="xs" color="accent">{'Забыли пароль?'}</Text>
                            </div>
                        )} */}

                        {error && <Text size="xs" color="accent">{error}</Text>}
                        {info && <Text size="xs" color="secondary">{info}</Text>}

                        <Button type="submit" variant="solid" fullWidth textSize="m" disabled={loading}>
                            {loading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
                        </Button>
                    </form>

                    {/* <div className="saro-login-switch">
                        <Text size="xs" color="secondary">{mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}</Text>
                        <Button variant="ghost" textSize="xs" textColor={theme == 'light' ? 'dark' : 'white'} onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                            {mode === 'login' ? 'Регистрация' : 'Войти'}
                        </Button>
                    </div> */}
                </div>
            </div>
        </PageComponent>
    )
}
