import { useEffect, useState } from "react"
import { PageComponent, Text } from "../../components"
import './style.css'
import { API_BASE_URL } from '../../config'

const ADMIN_TOKEN_KEY = 'qr_admin_token'

const getCodeFromPath = (): string => {
    const segments = window.location.pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] ?? ''
}

const resolveLink = (link: string): string => `${window.location.origin}${link}`

interface GetCodeResponse {
    message: string;
    link: string;
}

type Status = 'loading' | 'error' | 'redirecting'

const LoadComponent = ({text}: {text: string}) => (
    <div className="cards-loader">
        <span className="loader-spinner" />
        <Text size="s" color="lightGray">{text}</Text>
    </div>
)

export const CardsPage = () => {
    const [status, setStatus] = useState<Status>('loading')

    useEffect(() => {
        const codeId = getCodeFromPath()
        const token = localStorage.getItem(ADMIN_TOKEN_KEY)

        fetch(`${API_BASE_URL}/get-code?code_id=${encodeURIComponent(codeId)}`, {
            headers: token ? {Authorization: `Bearer ${token}`} : undefined,
        })
            .then((res) => {
                if (!res.ok) throw new Error('request failed')
                return res.json()
            })
            .then((data: GetCodeResponse) => {
                const target = resolveLink(data.link)

                setStatus('redirecting')
                window.location.href = target
            })
            .catch(() => setStatus('error'))
    }, [])

    if (status === 'error') {
        return (
            <PageComponent>
                <Text size="m" color="lightGray">Не удалось найти такую карту</Text>
            </PageComponent>
        )
    }

    return (
        <PageComponent>
            <LoadComponent text={status === 'redirecting' ? 'Переходим по ссылке…' : 'Загрузка…'} />
        </PageComponent>
    )
}
