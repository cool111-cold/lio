import { CSSProperties, ReactElement, useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { PageComponent, Text, Button } from "../../components"
import { CardPreview } from "./components/card-preview"
import { SetupDemo } from "./components/setup-demo"
import { SupportModal } from "../get-qr-admin/components/support-modal"
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
import wifiIcon from './icons/wifi.svg'
import saveContactIcon from './icons/save-contact.svg'
import designRating24 from '../../assets/img/24.png'
import designRating25 from '../../assets/img/25.png'
import designRating26 from '../../assets/img/26.png'
import designRating from '../../assets/img/2.png'
import designSocial from '../../assets/img/6.jpg'
import designLimited from '../../assets/img/7.jpg'
import designCute from '../../assets/img/8.jpg'
import designCustom from '../../assets/img/10-front.png'
import stepScanImage from '../../assets/img/person-scanning-qr-code.avif'
import stepPageImage from '../../assets/img/screen.png'
import stepAdminImage from '../../assets/img/admin.png'
import './style.css'

interface Step {
    number: string;
    title: string;
    description: string;
    image: string;
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
    {icon: tipsIcon, color: '#A8E10C', label: 'Быстрые переводы'},
    {icon: linkIcon, color: '#A78BFA', label: 'Ссылки на соцсети'},
    {icon: contactsIcon, color: '#FF8A7A', label: 'Контакты для записи'},
    {icon: wifiIcon, color: '#5CC8FF', label: 'Подключение к Wi-Fi'},
    {icon: saveContactIcon, color: '#A78BFA', label: 'Сохранение номера в контакты'},
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
        description: 'Гость сразу попадает на форму отзыва в Яндекс.Картах или 2gis',
        image: designRating24,
    },
    {
        id: 'social',
        title: 'Мы в соц сетях',
        description: 'Собирает подписчиков во все соцсети магазина в один клик',
        image: designRating25,
    },
    {
        id: 'limited',
        title: 'Лимитированная',
        description: 'Нумерованная серия с необычным дизайном для коллекционеров',
        image: designRating26,
    },
    {
        id: 'cute',
        title: 'Мимими',
        description: 'Милый минималистичный дизайн для личного профиля',
        image: designRating,
    },
    // {
    //     id: 'custom',
    //     title: 'Кастом',
    //     description: 'Загрузите логотип и цвета бренда — сделаем индивидуальный макет',
    //     image: designCustom,
    // },
]

const STEPS_AUTOPLAY_MS = 5000

const DESIGN_IMAGES = CARD_DESIGNS.map((design) => design.image)

const STEPS: Step[] = [
    {
        number: '01',
        title: 'Привяжите карту',
        description: 'Отсканируйте QR-код или NFC-карту — она свяжется с вашим магазином, никаких настроек и печатей',
        image: stepScanImage,
    },
    {
        number: '02',
        title: 'Персональная страница',
        description: 'Добавьте ссылки в личном кабинете. Гости сразу попадают на страницу со ссылками: соцсети, сайт, мессенджеры',
        image: stepPageImage,
    },
    {
        number: '03',
        title: 'Управляйте из админки',
        description: 'Меняйте ссылки, обложку и текст в любой момент — без участия разработчиков',
        image: stepAdminImage,
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
        title: 'Бесплатный хостинг',
        description: 'Покупая карту, вы получаете хостинг вашей страницы — без ежемесячных платежей за её хранение',
    },
    {
        icon: supportIcon, color: '#FF8A7A',
        title: 'Просто и наглядно',
        description: 'Интуитивное управление в личном кабинете, аналитика переходов по ссылкам, а если появятся вопросы — всегда готовы помочь',
    },
    {
        icon: scenariesIcon, color: '#A78BFA',
        title: 'Безграничные сценарии',
        description: 'Сохраните ссылку на личный перевод или тизер нового альбома',
    },
]

interface ShareMethod {
    id: 'qr' | 'nfc' | 'link';
    color: string;
    title: string;
    description: string;
}

const SHARE_METHODS: ShareMethod[] = [
    {
        id: 'qr', color: '#A8E10C',
        title: 'QR-код',
        description: 'Гость наводит камеру смартфона на карту — страница открывается сразу, без установки приложений',
    },
    {
        id: 'nfc', color: '#5CC8FF',
        title: 'NFC-касание',
        description: 'Достаточно приложить карту к телефону — ссылка откроется в браузере за секунду',
    },
    {
        id: 'link', color: '#F472B6',
        title: 'Ссылка на расстоянии',
        description: 'Отправьте адрес страницы в мессенджер, SMS или почту — карта работает и без личной встречи',
    },
]

const SHARE_ICONS: Record<ShareMethod['id'], ReactElement> = {
    qr: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <path d="M14 14h3v3M21 14v.01M14 21h.01M17.5 21H21v-3.5" />
        </>
    ),
    nfc: (
        <>
            <path d="M6 8.5a5 5 0 0 1 0 7" />
            <path d="M9.5 6a9 9 0 0 1 0 12" />
            <path d="M13 3.5a13 13 0 0 1 0 17" />
            <path d="M17 6.5v11" />
        </>
    ),
    link: (
        <>
            <path d="M21 3 10 14" />
            <path d="M21 3l-7 18-4-7-7-4 18-7Z" />
        </>
    ),
}

interface CompareRow {
    feature: string;
    paper: string;
    lio: string;
}

const COMPARE_ROWS: CompareRow[] = [
    {feature: 'Смена контактов', paper: 'Перепечатывать тираж', lio: 'Пара кликов в кабинете'},
    {feature: 'Сколько ссылок', paper: 'Сколько влезет на картон', lio: 'Сколько угодно'},
    {feature: 'Соцсети и отзывы', paper: 'Переписывать вручную', lio: 'Открываются в один клик'},
    {feature: 'Статистика', paper: 'Нет', lio: 'Переходы по каждой ссылке'},
    {feature: 'Срок службы', paper: 'Мнётся и теряется', lio: 'Пластик, служит годами'},
]

interface LinkMetric {
    label: string;
    color: string;
    clicks: number;
}

const LINK_METRICS: LinkMetric[] = [
    {label: 'Отзыв в Яндекс.Картах', color: '#FFC94D', clicks: 412},
    {label: 'Telegram-канал', color: '#5CC8FF', clicks: 318},
    {label: 'Меню и цены', color: '#A8E10C', clicks: 254},
    {label: 'WhatsApp для записи', color: '#F472B6', clicks: 167},
]

const MAX_CLICKS = Math.max(...LINK_METRICS.map((metric) => metric.clicks))

interface Faq {
    question: string;
    answer: string;
}

const FAQS: Faq[] = [
    {
        question: 'Нужно ли гостю устанавливать приложение?',
        answer: 'Нет. Страница открывается в обычном браузере смартфона — после сканирования QR-кода или касания NFC-картой.',
    },
    {
        question: 'Как работает NFC-карта?',
        answer: 'Внутри карты есть чип с вашей ссылкой. Большинство современных смартфонов считывают его при касании и сразу открывают страницу. Если NFC выключен — всегда остаётся QR-код.',
    },
    {
        question: 'Можно ли поменять ссылки после покупки?',
        answer: 'Да, в любой момент в личном кабинете. Карта останется той же — поменяется только то, что увидит гость.',
    },
    {
        question: 'Нужно ли платить за страницу каждый месяц?',
        answer: 'Нет. Хостинг страницы входит в стоимость карты — без подписок и ежемесячных платежей.',
    },
    {
        question: 'Чем карта лучше бумажной визитки?',
        answer: 'Её не нужно перепечатывать, на ней помещается сколько угодно ссылок, а в кабинете видно, по каким из них переходят чаще всего.',
    },
    {
        question: 'Можно ли сделать карту в фирменном стиле?',
        answer: 'Да. Выберите дизайн «Кастом», загрузите логотип и цвета бренда — мы подготовим индивидуальный макет.',
    },
]

const goToAdmin = () => {
    window.location.href = '/admin'
}

const goToCard = () => {
    window.location.href = '/1'
}

const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'})
}

gsap.registerPlugin(ScrollTrigger)

export const MainQrPage = () => {
    const rootRef = useRef<HTMLDivElement>(null)
    const [orderedDesignId, setOrderedDesignId] = useState<string | null>(null)
    const [openFaq, setOpenFaq] = useState<number | null>(0)
    const [showSupport, setShowSupport] = useState(false)
    const [activeStep, setActiveStep] = useState(0)
    // увеличивается при каждом переключении, чтобы прогресс автопрокрутки начинался заново
    const [stepCycle, setStepCycle] = useState(0)
    const [isStepsHovered, setIsStepsHovered] = useState(false)
    const [isStepsInView, setIsStepsInView] = useState(false)
    // автопрокрутка стартует только после того, как слайдер проявился, иначе прогресс идёт, пока его не видно
    const [isStepsRevealed, setIsStepsRevealed] = useState(false)
    const isStepsPaused = isStepsHovered || !isStepsInView || !isStepsRevealed
    const showcaseCanvasRef = useRef<HTMLDivElement>(null)
    // 3D-сцену монтируем только рядом с экраном и не рендерим, когда её не видно
    const [isShowcaseMounted, setIsShowcaseMounted] = useState(false)
    const [isShowcaseVisible, setIsShowcaseVisible] = useState(false)
    const stepsRef = useRef<HTMLDivElement>(null)
    const stepsTouchX = useRef<number | null>(null)

    const goToStep = (index: number) => {
        setActiveStep((index + STEPS.length) % STEPS.length)
        setStepCycle((cycle) => cycle + 1)
    }
    const [activeDesignIndex, setActiveDesignIndex] = useState(0)
    const activeDesign = CARD_DESIGNS[activeDesignIndex]

    const handleOrder = (id: string) => {
        setOrderedDesignId(id)
    }

    useEffect(() => {
        const el = stepsRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setIsStepsInView(entry.isIntersecting),
            {root: rootRef.current, threshold: 0.3},
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const el = showcaseCanvasRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsShowcaseVisible(entry.isIntersecting)
                if (entry.isIntersecting) setIsShowcaseMounted(true)
            },
            {root: rootRef.current, rootMargin: '300px 0px'},
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

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
                .from('.onboarding-steps-hint', {opacity: 0, y: 12, duration: 0.5}, '-=0.3')
                // .from('.onboarding-steps', {opacity: 0, y: 24, duration: 0.6}, '-=0.2')
                .from('.setup-demo-phone', {opacity: 0, y: 80, scale: 0.92, duration: 0.9}, '-=0.2')
                .from('.setup-demo-counter', {opacity: 0, scale: 0.7, duration: 0.8}, '-=0.5')
                .from('.setup-demo-caption', {opacity: 0, y: 12, duration: 0.4}, '-=0.4')
                .call(() => setIsStepsRevealed(true))
                .from('.onboarding-cta', {opacity: 0, y: 12, duration: 0.4}, '-=0.15')

            ;[
                '.onboarding-showcase',
                '.onboarding-share-heading', '.onboarding-share-card',
                '.onboarding-advantages-heading', '.onboarding-advantage',
                '.onboarding-compare-heading', '.onboarding-compare',
                '.onboarding-analytics',
                '.onboarding-faq-heading', '.onboarding-faq-item',
                '.onboarding-try',
            ].forEach((selector) => {
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

            gsap.from('.onboarding-analytics-bar-fill', {
                scaleX: 0,
                duration: 1,
                ease: 'power3.out',
                stagger: 0.12,
                scrollTrigger: {trigger: '.onboarding-analytics', scroller: rootRef.current, start: 'top 80%', once: true},
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
                            <Text size="xs" color="lightGray">VLink · QR-платформа</Text>
                        </div>

                        <div className="onboarding-title">
                            <Text size="xl" animation gradientWord="карте">Все ваши ссылки в одной карте</Text>
                        </div>

                        <div className="onboarding-subtitle">
                            <Text size="m" color="gray">
                                Свяжите QR-код и NFC-карту с персональной страницей и управляйте ссылками из админ-панели — без участия разработчиков
                            </Text>
                        </div>

                        <div className="onboarding-hero-actions">
                            <Button variant="solid" textSize="s" onClick={goToCard}>Наша карта</Button>
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
                        <div className="onboarding-steps-hint">
                            <Text size="s" color="lightGray">Попробуйте сами - нажмите на экран</Text>
                        </div>
                        <SetupDemo />
                        {/* Карусель шагов временно скрыта — её заменил интерактив SetupDemo
                        <div
                            className={`onboarding-steps${isStepsPaused ? ' is-paused' : ''}`}
                            style={{'--steps-autoplay': `${STEPS_AUTOPLAY_MS}ms`} as CSSProperties}
                            ref={stepsRef}
                            onMouseEnter={() => setIsStepsHovered(true)}
                            onMouseLeave={() => setIsStepsHovered(false)}
                            onTouchStart={(e) => {
                                stepsTouchX.current = e.touches[0].clientX
                            }}
                            onTouchEnd={(e) => {
                                if (stepsTouchX.current === null) return
                                const dx = e.changedTouches[0].clientX - stepsTouchX.current
                                stepsTouchX.current = null
                                if (Math.abs(dx) > 40) goToStep(activeStep + (dx < 0 ? 1 : -1))
                            }}
                        >
                            <div className="onboarding-steps-viewport" aria-live="polite">
                                <div className="onboarding-steps-track" style={{'--active-step': activeStep} as CSSProperties}>
                                    {STEPS.map((step, i) => (
                                        <div
                                            className={`onboarding-step${i === activeStep ? ' is-active' : ''}`}
                                            key={step.number}
                                            aria-hidden={i !== activeStep}
                                            onClick={i === activeStep ? undefined : () => goToStep(i)}
                                            aria-roledescription="слайд"
                                            aria-label={`${i + 1} из ${STEPS.length}`}
                                        >
                                            <div className="onboarding-step-image">
                                                <img src={step.image} alt={step.title} />
                                            </div>
                                            <div className="onboarding-step-text">
                                                <span className="onboarding-step-number">{step.number}</span>
                                                <Text size="l" color="white">{step.title}</Text>
                                                <Text size="s" color="lightGray">{step.description}</Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="onboarding-steps-controls">
                                <button type="button" className="onboarding-steps-arrow" aria-label="Предыдущий шаг" onClick={() => goToStep(activeStep - 1)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <div className="onboarding-steps-dots">
                                    {STEPS.map((step, i) => (
                                        <button
                                            type="button"
                                            key={step.number}
                                            className={`onboarding-steps-dot${i === activeStep ? ' is-active' : ''}`}
                                            aria-label={`Шаг ${step.number}: ${step.title}`}
                                            aria-current={i === activeStep}
                                            onClick={() => goToStep(i)}
                                        >
                                            {i === activeStep && (
                                                <span
                                                    className="onboarding-steps-dot-fill"
                                                    key={stepCycle}
                                                    onAnimationEnd={() => goToStep(activeStep + 1)}
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <button type="button" className="onboarding-steps-arrow" aria-label="Следующий шаг" onClick={() => goToStep(activeStep + 1)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        */}
                    </div>

                    <div className="onboarding-divider" />

                    <section className="onboarding-showcase" id="onboarding-designs-section">
                        <div className="onboarding-showcase-canvas" ref={showcaseCanvasRef}>
                            {isShowcaseMounted && (
                                <CardPreview images={DESIGN_IMAGES} activeIndex={activeDesignIndex} active={isShowcaseVisible} />
                            )}
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

                        <div className="onboarding-showcase-body">
                            <div className="onboarding-showcase-meta">
                                <Text size="xs" color="lightGray">Дизайн карты</Text>
                                <span className="onboarding-showcase-counter">
                                    {String(activeDesignIndex + 1).padStart(2, '0')} / {String(CARD_DESIGNS.length).padStart(2, '0')}
                                </span>
                            </div>

                            <div className="onboarding-showcase-info" key={activeDesign.id}>
                                <Text size="xl" color="white">{activeDesign.title}</Text>
                                <Text size="s" color="lightGray">{activeDesign.description}</Text>
                            </div>

                            <div className="onboarding-showcase-styles" role="radiogroup" aria-label="Стиль карты">
                                {CARD_DESIGNS.map((design, i) => (
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={i === activeDesignIndex}
                                        aria-label={design.title}
                                        title={design.title}
                                        className={`onboarding-showcase-style${i === activeDesignIndex ? ' is-active' : ''}`}
                                        key={design.id}
                                        onClick={() => setActiveDesignIndex(i)}
                                    >
                                        <img src={design.image} alt="" />
                                    </button>
                                ))}
                            </div>

                            <div className="onboarding-showcase-actions">
                                <Button
                                    variant="solid"
                                    textSize="s"
                                    disabled={orderedDesignId === activeDesign.id}
                                    onClick={() => handleOrder(activeDesign.id)}
                                >
                                    {orderedDesignId === activeDesign.id ? 'Заявка отправлена ✓' : 'Заказать эту карту'}
                                </Button>
                            </div>
                        </div>
                    </section>

                    <div className="onboarding-divider" />

                    <div className="onboarding-share-heading">
                        <Text size="xs" color="lightGray">Без приложений</Text>
                        <Text size="l" color="white">Три способа поделиться</Text>
                    </div>

                    <div className="onboarding-share">
                        {SHARE_METHODS.map((method) => (
                            <div className="onboarding-share-card" key={method.id}>
                                <span className="onboarding-share-icon" style={{color: method.color}} aria-hidden="true">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        {SHARE_ICONS[method.id]}
                                    </svg>
                                </span>
                                <Text size="m" color="white">{method.title}</Text>
                                <Text size="s" color="lightGray">{method.description}</Text>
                            </div>
                        ))}
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

                    <div className="onboarding-compare-heading">
                        <Text size="xs" color="lightGray">Больше, чем визитка</Text>
                        <Text size="l" color="white">Бумага против VLink</Text>
                    </div>

                    <div className="onboarding-compare">
                        <div className="onboarding-compare-row onboarding-compare-head">
                            <span />
                            <Text size="xs" color="lightGray">Бумажная визитка</Text>
                            <Text size="xs" color="accent">Карта VLink</Text>
                        </div>
                        {COMPARE_ROWS.map((row) => (
                            <div className="onboarding-compare-row" key={row.feature}>
                                <Text size="s" color="white">{row.feature}</Text>
                                <div className="onboarding-compare-cell onboarding-compare-cell-paper">
                                    <span className="onboarding-compare-mark" aria-hidden="true">✕</span>
                                    <Text size="s" color="gray">{row.paper}</Text>
                                </div>
                                <div className="onboarding-compare-cell onboarding-compare-cell-lio">
                                    <span className="onboarding-compare-mark" aria-hidden="true">✓</span>
                                    <Text size="s" color="white">{row.lio}</Text>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="onboarding-divider" />

                    <div className="onboarding-analytics">
                        <div className="onboarding-analytics-text">
                            <Text size="xs" color="lightGray">Аналитика</Text>
                            <Text size="l" color="white">Видно, что работает</Text>
                            <Text size="s" color="lightGray">
                                В личном кабинете считаются переходы по каждой ссылке. Поставили карту на кассу или раздали на выставке — сразу понятно, куда гости идут чаще всего
                            </Text>
                        </div>
                        <div className="onboarding-analytics-panel" aria-label="Пример статистики переходов">
                            <div className="onboarding-analytics-panel-head">
                                <Text size="xs" color="lightGray">Переходы за месяц</Text>
                                <span className="onboarding-analytics-badge">пример</span>
                            </div>
                            {LINK_METRICS.map((metric) => (
                                <div className="onboarding-analytics-row" key={metric.label}>
                                    <div className="onboarding-analytics-row-top">
                                        <Text size="s" color="white">{metric.label}</Text>
                                        <span className="onboarding-analytics-count">{metric.clicks}</span>
                                    </div>
                                    <div className="onboarding-analytics-bar">
                                        <div
                                            className="onboarding-analytics-bar-fill"
                                            style={{width: `${(metric.clicks / MAX_CLICKS) * 100}%`, backgroundColor: metric.color}}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="onboarding-divider" />

                    <div className="onboarding-faq-heading">
                        <Text size="xs" color="lightGray">Остались вопросы?</Text>
                        <Text size="l" color="white">Частые вопросы</Text>
                    </div>

                    <div className="onboarding-faq">
                        {FAQS.map((faq, i) => {
                            const isOpen = openFaq === i
                            return (
                                <div className={`onboarding-faq-item${isOpen ? ' is-open' : ''}`} key={faq.question}>
                                    <button
                                        type="button"
                                        className="onboarding-faq-question"
                                        aria-expanded={isOpen}
                                        onClick={() => setOpenFaq(isOpen ? null : i)}
                                    >
                                        <Text size="m" color="white">{faq.question}</Text>
                                        <span className="onboarding-faq-toggle" aria-hidden="true" />
                                    </button>
                                    <div className="onboarding-faq-answer">
                                        <div className="onboarding-faq-answer-inner">
                                            <Text size="s" color="lightGray">{faq.answer}</Text>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="onboarding-divider" />

                    <div className="onboarding-try">
                        <Text size="xs" color="lightGray">Попробуйте сами</Text>
                        <Text size="l" color="white">Посмотрите карту в деле</Text>
                        <Text size="s" color="lightGray">Откройте нашу страницу так же, как её увидят ваши гости, — а потом соберите свою</Text>
                        <div className="onboarding-hero-actions">
                            <Button variant="solid" textSize="s" onClick={goToCard}>Открыть пример</Button>
                            <Button variant="outline" textSize="s" textColor="white" onClick={() => setShowSupport(true)}>Связаться с нами</Button>
                        </div>
                    </div>

                    <div className="onboarding-inner onboarding-inner-bottom">
                        <div className="onboarding-cta">
                            <Button variant="solid" textSize="m" onClick={goToAdmin}>Войти в панель управления</Button>
                        </div>
                    </div>
                </div>
            </div>
            {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
        </PageComponent>
    )
}
