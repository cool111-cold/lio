import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { PageComponent, Text, Button } from "../../components"
import { CardPreview } from "./components/card-preview"
import vIcon from '../../assets/icons/v-icon.svg'
import companyIcon from './icons/company.svg'
import personIcon from './icons/fisical-faces.svg'
import economyIcon from './icons/economy.svg'
import changeIcon from './icons/change.svg'
import calendarIcon from './icons/calendar.svg'
import supportIcon from './icons/support.svg'
import scenariesIcon from './icons/scenaries.svg'
import menuIcon from './icons/menu.svg'
import businessCardIcon from './icons/business-card.svg'
import ticketsIcon from './icons/tickets.svg'
import tipsIcon from './icons/tips.svg'
import linkIcon from './icons/link.svg'
import contactsIcon from './icons/contacts.svg'
import growthIcon from './icons/growth.svg'
import flagIcon from './icons/flag.svg'
import reviewsIcon from './icons/reviews.svg'
import designRating from '../../assets/img/2.jpg'
import designSocial from '../../assets/img/6.jpg'
import designLimited from '../../assets/img/7.jpg'
import designCute from '../../assets/img/8.jpg'
import designCustom from '../../assets/img/10-front.png'
import './style.css'

interface Step {
    number: string;
    title: string;
    description: string;
}

interface UseCase {
    icon: string;
    color: string;
    label: string;
}

interface Audience {
    icon: string;
    color: string;
    title: string;
    subtitle: string;
}

const AUDIENCES: Audience[] = [
    {icon: companyIcon, color: '#5CC8FF', title: 'Компании', subtitle: 'Кафе, магазины, услуги'},
    {icon: personIcon, color: '#F472B6', title: 'Частные лица', subtitle: 'Визитка, блог, соцсети'},
]

const USE_CASES: UseCase[] = [
    {icon: menuIcon, color: '#FFC94D', label: 'Меню кафе и ресторанов'},
    {icon: businessCardIcon, color: '#5CC8FF', label: 'Цифровая визитка'},
    {icon: ticketsIcon, color: '#F472B6', label: 'Билеты и мероприятия'},
    {icon: tipsIcon, color: '#A8E10C', label: 'Чаевые в клик'},
    {icon: linkIcon, color: '#A78BFA', label: 'Ссылки на соцсети'},
    {icon: contactsIcon, color: '#FF8A7A', label: 'Контакты для записи'},
    {icon: growthIcon, color: '#A8E10C', label: 'Продвижение бренда'},
    {icon: flagIcon, color: '#5CC8FF', label: 'Размещение на зоне регистрации'},
    {icon: personIcon, color: '#FFC94D', label: 'Выдача клиентам'},
    {icon: scenariesIcon, color: '#F472B6', label: 'Приложение к товару'},
    {icon: reviewsIcon, color: '#FF8A7A', label: 'Отзывы и оценки в клик'},
]

const MARQUEE_ITEMS = [...USE_CASES, ...USE_CASES]

interface CardDesign {
    id: string;
    title: string;
    description: string;
    image: string;
}

const CARD_DESIGNS: CardDesign[] = [
    {
        id: 'rating',
        title: 'Оставьте оценку',
        description: 'Гость сразу попадает на форму отзыва в Яндекс.Картах или Google',
        image: designRating,
    },
    {
        id: 'social',
        title: 'Мы в соц сетях',
        description: 'Собирает подписчиков во все соцсети магазина в один клик',
        image: designSocial,
    },
    {
        id: 'limited',
        title: 'Лимитированная',
        description: 'Нумерованная серия с необычным дизайном для коллекционеров',
        image: designLimited,
    },
    {
        id: 'cute',
        title: 'Мимими',
        description: 'Милый минималистичный дизайн для личного профиля',
        image: designCute,
    },
    {
        id: 'custom',
        title: 'Кастом',
        description: 'Загрузите логотип и цвета бренда — сделаем индивидуальный макет',
        image: designCustom,
    },
]

const STEPS: Step[] = [
    {
        number: '01',
        title: 'Привяжите карту',
        description: 'Отсканируйте QR-код или NFC-карту — она свяжется с вашим магазином, никаких настроек и печатей',
    },
    {
        number: '02',
        title: 'Персональная страница',
        description: 'Добавьте ссылки в личном кабинете. Гости сразу попадают на страницу со ссылками: соцсети, сайт, мессенджеры',
    },
    {
        number: '03',
        title: 'Управляйте из админки',
        description: 'Меняйте ссылки, обложку и текст в любой момент — без участия разработчиков',
    },
]

interface Advantage {
    icon: string;
    color: string;
    title: string;
    description: string;
}

const ADVANTAGES: Advantage[] = [
    {
        icon: economyIcon, color: '#A8E10C',
        title: 'Экономия на печати',
        description: 'Не нужно покупать отдельную карточку под каждую ссылку — все ссылки живут в одном месте',
    },
    {
        icon: changeIcon, color: '#5CC8FF',
        title: 'Меняйте на лету',
        description: 'Переехали на другой сайт или в другое здание? Просто поменяйте ссылку в личном кабинете — перепечатывать и перенастраивать ничего не нужно',
    },
    {
        icon: calendarIcon, color: '#FFC94D',
        title: 'Хостинг навсегда',
        description: 'Покупая карту, вы получаете бессрочный хостинг вашей страницы — без ежемесячных платежей за её хранение',
    },
    {
        icon: supportIcon, color: '#FF8A7A',
        title: 'Просто, и мы рядом',
        description: 'Интуитивное управление в личном кабинете, а если появятся вопросы — всегда готовы помочь',
    },
    {
        icon: scenariesIcon, color: '#A78BFA',
        title: 'Безграничные сценарии',
        description: 'От визитки на чаевые и ссылки на отзыв до личной многоразовой визитки или тизера нового альбома',
    },
]

const goToAdmin = () => {
    window.location.href = '/admin'
}

const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'})
}

gsap.registerPlugin(ScrollTrigger)

export const MainQrPage = () => {
    const rootRef = useRef<HTMLDivElement>(null)
    const [orderedDesignId, setOrderedDesignId] = useState<string | null>(null)

    const handleOrder = (id: string) => {
        setOrderedDesignId(id)
    }

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.timeline({defaults: {ease: 'power3.out'}})
                .from('.onboarding-logo', {opacity: 0, y: -12, duration: 0.6})
                .from('.onboarding-eyebrow', {opacity: 0, y: 12, duration: 0.5}, '-=0.3')
                .from('.onboarding-title', {opacity: 0, y: 16, duration: 0.6}, '-=0.3')
                .from('.onboarding-subtitle', {opacity: 0, y: 12, duration: 0.5}, '-=0.35')
                .from('.onboarding-hero-actions', {opacity: 0, y: 12, duration: 0.5}, '-=0.3')
                .from('.onboarding-divider', {opacity: 0, scaleX: 0, duration: 0.5}, '-=0.2')
                .from('.onboarding-marquee-intro', {opacity: 0, y: 12, duration: 0.5}, '-=0.2')
                .from('.onboarding-marquee', {opacity: 0, duration: 0.6}, '-=0.2')
                .from('.onboarding-steps-heading', {opacity: 0, y: 12, duration: 0.5}, '-=0.1')
                .from('.onboarding-step', {opacity: 0, y: 24, duration: 0.5, stagger: 0.15}, '-=0.2')
                .from('.onboarding-cta', {opacity: 0, y: 12, duration: 0.4}, '-=0.15')

            ;['.onboarding-advantages-heading', '.onboarding-advantage', '.onboarding-designs-heading', '.onboarding-design-card'].forEach((selector) => {
                gsap.utils.toArray<HTMLElement>(selector).forEach((el) => {
                    gsap.from(el, {
                        opacity: 0,
                        y: 24,
                        duration: 0.6,
                        ease: 'power3.out',
                        scrollTrigger: {trigger: el, scroller: rootRef.current, start: 'top 90%', once: true},
                    })
                })
            })

            gsap.to('.onboarding-marquee-track', {
                xPercent: -50,
                duration: 28,
                ease: 'none',
                repeat: -1,
            })
        }, rootRef)

        return () => ctx.revert()
    }, [])

    return (
        <PageComponent center={false}>
            <div className="onboarding" ref={rootRef}>
                <div className="onboarding-content">
                    <div className="onboarding-inner onboarding-inner-top">
                        <div className="onboarding-logo">
                            <img src={vIcon} className="onboarding-logo-icon" alt="" />
                            <img src={vIcon} className="onboarding-logo-icon" style={{transform: 'rotate(180deg)'}} alt="" />
                        </div>

                        <div className="onboarding-eyebrow">
                            <Text size="xs" color="lightGray">LIO · QR-платформа</Text>
                        </div>

                        <div className="onboarding-title">
                            <Text size="xl" animation>Одна карта — все ваши ссылки</Text>
                        </div>

                        <div className="onboarding-subtitle">
                            <Text size="m" color="gray">
                                Свяжите QR-код и NFC-карту с персональной страницей и управляйте ссылками из админ-панели — без участия разработчиков
                            </Text>
                        </div>

                        <div className="onboarding-hero-actions">
                            <Button variant="solid" textSize="s" onClick={() => scrollToSection('onboarding-steps-section')}>Перейти к настройке</Button>
                            <Button variant="outline" textSize="s" textColor="white" onClick={() => scrollToSection('onboarding-designs-section')}>Оформить сейчас</Button>
                        </div>
                    </div>

                    <div className="onboarding-divider" />

                    <div className="onboarding-marquee-intro">
                        <Text size="s" color="lightGray">Карта подходит для:</Text>
                        <div className="onboarding-marquee-audience">
                            {AUDIENCES.map((audience) => (
                                <div className="onboarding-audience-chip" key={audience.title}>
                                    <span className="onboarding-audience-icon" style={{maskImage: `url(${audience.icon})`, WebkitMaskImage: `url(${audience.icon})`, backgroundColor: audience.color}} aria-hidden="true" />
                                    <div className="onboarding-audience-text">
                                        <Text size="s" color="white">{audience.title}</Text>
                                        <Text size="xs" color="lightGray">{audience.subtitle}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="onboarding-marquee">
                        <div className="onboarding-marquee-fade onboarding-marquee-fade-left" />
                        <div className="onboarding-marquee-fade onboarding-marquee-fade-right" />
                        <div className="onboarding-marquee-track">
                            {MARQUEE_ITEMS.map((useCase, i) => (
                                <div className="onboarding-marquee-item" key={`${useCase.label}-${i}`}>
                                    <span className="onboarding-marquee-icon" style={{maskImage: `url(${useCase.icon})`, WebkitMaskImage: `url(${useCase.icon})`, backgroundColor: useCase.color}} aria-hidden="true" />
                                    <Text size="s" color="white">{useCase.label}</Text>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="onboarding-divider" />

                    <div className="onboarding-inner" id="onboarding-steps-section">
                        <div className="onboarding-steps-heading">
                            <Text size='l' color="white">Настройка в пару кликов</Text>
                        </div>
                        <div className="onboarding-steps">
                            {STEPS.map((step) => (
                                <div className="onboarding-step" key={step.number}>
                                    <span className="onboarding-step-number">{step.number}</span>
                                    <Text size="m" color="white">{step.title}</Text>
                                    <Text size="s" color="lightGray">{step.description}</Text>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="onboarding-divider" />

                    <div className="onboarding-advantages-heading">
                        <Text size="xs" color="lightGray">Почему именно мы</Text>
                        <Text size="l" color="white">Наши плюсы</Text>
                    </div>

                    <div className="onboarding-advantages">
                        {ADVANTAGES.map((advantage) => (
                            <div className="onboarding-advantage" key={advantage.title}>
                                <span className="onboarding-advantage-icon" style={{maskImage: `url(${advantage.icon})`, WebkitMaskImage: `url(${advantage.icon})`, backgroundColor: advantage.color}} aria-hidden="true" />
                                <Text size="m" color="white">{advantage.title}</Text>
                                <Text size="s" color="lightGray">{advantage.description}</Text>
                            </div>
                        ))}
                    </div>

                    <div className="onboarding-divider" />

                    <div className="onboarding-designs-heading" id="onboarding-designs-section">
                        <Text size="xs" color="lightGray">Дизайн карты</Text>
                        <Text size="l">Выберите оформление</Text>
                    </div>

                    <div className="onboarding-designs">
                        {CARD_DESIGNS.map((design) => (
                            <div className="onboarding-design-card" key={design.id}>
                                <div className="onboarding-design-canvas">
                                    <CardPreview image={design.image} />
                                    <div className="onboarding-design-rotate-hint" aria-hidden="true">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                            <path d="M21 3v5h-5" />
                                            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                                            <path d="M3 21v-5h5" />
                                        </svg>
                                        <span>Крутите</span>
                                    </div>
                                </div>
                                <div className="onboarding-design-body">
                                    <Text size="l" color="white">{design.title}</Text>
                                    <Text size="s" color="lightGray">{design.description}</Text>
                                    <Button
                                        variant="outline"
                                        textSize="s"
                                        textColor="white"
                                        disabled={orderedDesignId === design.id}
                                        onClick={() => handleOrder(design.id)}
                                    >
                                        {orderedDesignId === design.id ? 'Заявка отправлена ✓' : 'Заказать'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="onboarding-inner onboarding-inner-bottom">
                        <div className="onboarding-cta">
                            <Button variant="solid" textSize="m" onClick={goToAdmin}>Войти в панель управления</Button>
                        </div>
                    </div>
                </div>
            </div>
        </PageComponent>
    )
}
