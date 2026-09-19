import { useEffect, useState } from "react"
import { PageComponent, Text, Button } from "../../components"
import './style.css'

const API_BASE_URL = 'http://127.0.0.1:8000'
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

type Status = 'loading' | 'error' | 'redirecting' | 'updated'

const LoadComponent = ({text}: {text: string}) => (
    <div className="cards-loader">
        <span className="loader-spinner" />
        <Text size="s" color="lightGray">{text}</Text>
    </div>
)

export const CardsPage = () => {
    const [status, setStatus] = useState<Status>('loading')
    const [link, setLink] = useState<string | null>(null)

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

                if (data.message === 'Code updated') {
                    setLink(target)
                    setStatus('updated')
                    return
                }

                setStatus('redirecting')
                window.location.href = target
            })
            .catch(() => setStatus('error'))
    }, [])

    if (status === 'error') {
        return (
            <PageComponent>
                <Text size="s" color="lightGray">Не удалось найти карту</Text>
            </PageComponent>
        )
    }

    // if (status === 'loading' || status === 'redirecting') {
    return (
        <PageComponent>
            <LoadComponent text={status === 'redirecting' ? 'Переходим по ссылке…' : 'Загрузка…'} />
        </PageComponent>
    )
    // }

    // return (
    //     <PageComponent>
    //         <div className="cards-notify-card">
    //             <Text size="l" color="white">Карта привязана</Text>
    //             <Text size="s" color="lightGray">Карта успешно привязана к вашему магазину</Text>
    //             <Button
    //                 variant="solid"
    //                 fullWidth
    //                 textSize="m"
    //                 onClick={() => link && (window.location.href = link)}
    //             >
    //                 Продолжить
    //             </Button>
    //         </div>
    //     </PageComponent>
    // )
}
