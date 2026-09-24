import { ChangeEvent, CSSProperties, SubmitEvent, useState } from "react"
import { PageComponent, Text, Button, Input } from "../../components"
import '../get-qr-admin/login.css'
import { API_BASE_URL } from '../../config'

type Mode = 'login' | 'init'

interface FormState {
    login: string;
    password: string;
    confirmPassword: string;
}

const INITIAL_FORM: FormState = {login: '', password: '', confirmPassword: ''}

const themeVars = {
    '--lio-text': '#f9f9f9',
    '--lio-input-bg': 'rgba(255, 255, 255, 0.05)',
} as unknown as CSSProperties

interface CrmLoginPageProps {
    onAuthenticated?: (token: string) => void;
}

export const CrmLoginPage = ({onAuthenticated}: CrmLoginPageProps = {}) => {
    const [mode, setMode] = useState<Mode>('login')
    const [form, setForm] = useState<FormState>(INITIAL_FORM)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const switchMode = (nextMode: Mode) => {
        setMode(nextMode)
        setError(null)
    }

    const updateField = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({...prev, [field]: e.target.value}))
    }

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault()
        setError(null)

        if (!form.login || !form.password) {
            setError('Заполните логин и пароль')
            return
        }
        if (mode === 'init' && form.password !== form.confirmPassword) {
            setError('Пароли не совпадают')
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/crm/${mode === 'login' ? 'login' : 'init-admin'}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({login: form.login, password: form.password}),
            })

            if (!response.ok) {
                if (mode === 'init' && response.status === 403) throw new Error('Администратор уже создан')
                if (mode === 'init' && response.status === 400) throw new Error('Логин уже занят')
                throw new Error('')
            }

            const data = await response.json()
            onAuthenticated?.(data.access_token)
        } catch (err) {
            const message = err instanceof Error && err.message ? err.message : null
            setError(message ?? (mode === 'login' ? 'Неверный логин или пароль' : 'Не удалось создать администратора'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageComponent>
            <div className="admin-login-card" style={themeVars}>
                <Text size="l" color="white">CRM</Text>

                <div className="admin-login-tabs">
                    <div className={`admin-login-tab${mode === 'login' ? ' admin-login-tab-active' : ''}`}>
                        <Button variant="ghost" fullWidth textSize="s" textColor={mode === 'login' ? 'white' : 'lightGray'} onClick={() => switchMode('login')}>Вход</Button>
                    </div>
                    <div className={`admin-login-tab${mode === 'init' ? ' admin-login-tab-active' : ''}`}>
                        <Button variant="ghost" fullWidth textSize="s" textColor={mode === 'init' ? 'white' : 'lightGray'} onClick={() => switchMode('init')}>Первый админ</Button>
                    </div>
                </div>

                <form className="admin-login-form" onSubmit={handleSubmit}>
                    <Input label="Логин" placeholder="Ваш логин" autoComplete="username" value={form.login} onChange={updateField('login')} />
                    <Input label="Пароль" placeholder="Пароль" secureToggle autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={updateField('password')} />
                    {mode === 'init' && (
                        <Input label="Повтор пароля" placeholder="Повторите пароль" secureToggle autoComplete="new-password" value={form.confirmPassword} onChange={updateField('confirmPassword')} />
                    )}

                    {error && <Text size="xs" color="accent">{error}</Text>}

                    <Button type="submit" variant="solid" fullWidth textSize="m" disabled={loading}>
                        {loading ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать администратора'}
                    </Button>
                </form>
            </div>
        </PageComponent>
    )
}
