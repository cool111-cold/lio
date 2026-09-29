import { useEffect, useState } from "react"

export const LINK_HINTS = [
    'Ваши соцсети',
    'Ссылка на оплату по СБП',
    'Ваша точка на картах для оценки',
    'Сохранение вашего номера в контактах',
    'Ваш сайт',
    'Подключение к вашему Wi-Fi',
    'Инструкции вашим сотрудникам',
    'Часто пересылаемые документы',
    'Ваше портфолио',
    'max',
    'telegram',
    'whatsapp',
    'Яндекс карты',
    '2гис',
    'Авито',
    'tik tok',
    'ВКонтакте',
    'Дзен',
    'Поддержка',
    'Ваш ассортимент',
]

const HINT_INTERVAL_MS = 2000

interface HintCarouselProps {
    hints: string[];
    size?: 's' | 'm';
}

export const HintCarousel = ({hints, size = 'm'}: HintCarouselProps) => {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => setIndex((i) => (i + 1) % hints.length), HINT_INTERVAL_MS)
        return () => clearInterval(timer)
    }, [hints])

    return (
        <div className="admin-onboarding-hints">
            <span className={`admin-onboarding-chip${size === 's' ? ' admin-onboarding-chip-small' : ''}`} key={index}>{hints[index]}</span>
        </div>
    )
}
