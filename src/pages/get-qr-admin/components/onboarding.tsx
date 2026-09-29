import { SubmitEvent, useState } from "react"
import { Text, Button, Input } from "../../../components"
import { resolveAssetUrl, extractErrorDetail } from "../../../helpers"
import { API_BASE_URL } from '../../../config'
import { Modal } from './modal'
import { ImagePicker } from './image-picker'
import { HintCarousel, LINK_HINTS } from './hint-carousel'

type Step = 'prompt' | 'title' | 'subtitle' | 'image' | 'link'

type FillStep = Exclude<Step, 'prompt'>

const STEPS: FillStep[] = ['title', 'subtitle', 'image', 'link']

// Значения, которые бэкенд проставляет новому магазину
const DEFAULT_STORE = {
    title: 'Название',
    subtitle: 'Описание / адрес',
    image: '/uploads/def.jpg',
}

const STEP_CONTENT: Record<FillStep, {question: string, hints: string[]}> = {
    title: {
        question: 'Давайте знакомиться, как зовут вас или вашу компанию?',
        hints: ['Ваше ФИО', 'Название вашего бренда', 'Что вы хотите от посетителя'],
    },
    subtitle: {
        question: 'Хотите добавить описание?',
        hints: ['Ваш адрес', 'Ваш девиз', 'Описание продукта', 'Анекдот'],
    },
    image: {
        question: 'Добавьте изображение, которое будут видеть все посетители',
        hints: ['Ваше фото', 'Фото вашего филиала', 'Логотип', 'Фото вашего продукта'],
    },
    link: {
        question: 'Давайте добавим первую ссылку, по ней сможет переходить пользователь, перейдя по вашей карте',
        hints: LINK_HINTS,
    },
}

interface OnboardingStore {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    links: unknown[];
}

const isStepPending = (step: FillStep, store: OnboardingStore) => {
    if (step === 'title') return store.title === DEFAULT_STORE.title
    if (step === 'subtitle') return store.subtitle === DEFAULT_STORE.subtitle
    if (step === 'image') return store.image === DEFAULT_STORE.image
    return store.links.length === 0
}

interface StoreOnboardingProps {
    store: OnboardingStore;
    token: string;
    onClose: () => void;
    onChanged: () => Promise<void> | void;
    onUnauthorized?: () => void;
}

export const StoreOnboarding = ({store, token, onClose, onChanged, onUnauthorized}: StoreOnboardingProps) => {
    // Список шагов фиксируем при открытии, чтобы он не менялся после сохранения
    const [steps] = useState<FillStep[]>(() => {
        const pending = STEPS.filter((s) => isStepPending(s, store))
        return pending.length ? pending : STEPS
    })
    const [step, setStep] = useState<Step>('prompt')
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [link, setLink] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Актуальные значения магазина: update-store принимает title и subtitle целиком
    const [saved, setSaved] = useState({title: store.title, subtitle: store.subtitle})

    const authHeaders = {Authorization: `Bearer ${token}`}

    const goNext = () => {
        setError(null)
        const index = steps.indexOf(step as FillStep)
        if (index === steps.length - 1) onClose()
        else setStep(steps[index + 1])
    }

    const updateStore = async (next: {title: string, subtitle: string}, image?: File) => {
        const body = new FormData()
        body.append('title', next.title)
        body.append('subtitle', next.subtitle)
        if (image) body.append('image', image)

        const res = await fetch(`${API_BASE_URL}/update-store?store_id=${store.id}`, {method: 'POST', headers: authHeaders, body})
        if (res.status === 401) {
            onUnauthorized?.()
            return false
        }
        if (!res.ok) throw new Error((await extractErrorDetail(res)) ?? '')
        setSaved(next)
        return true
    }

    const createLink = async () => {
        const params = new URLSearchParams({link: link.trim()})
        const res = await fetch(`${API_BASE_URL}/create-link?${params.toString()}`, {method: 'POST', headers: authHeaders})
        if (res.status === 401) {
            onUnauthorized?.()
            return false
        }
        if (!res.ok) throw new Error((await extractErrorDetail(res)) ?? '')
        return true
    }

    const submit = async (e: SubmitEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            let ok = true
            if (step === 'title') ok = await updateStore({...saved, title: title.trim()})
            if (step === 'subtitle') ok = await updateStore({...saved, subtitle: subtitle.trim()})
            if (step === 'image' && imageFile) ok = await updateStore(saved, imageFile)
            if (step === 'link') ok = await createLink()
            if (!ok) return

            await onChanged()
            goNext()
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : 'Не удалось сохранить')
        } finally {
            setSaving(false)
        }
    }

    if (step === 'prompt') {
        return (
            <Modal title="Настройка магазина" onClose={onClose}>
                <div className="admin-profile-edit">
                    <Text size="s" color="lightGray">Хотите, поможем настроить ваш магазин в несколько шагов?</Text>
                    <div className="admin-onboarding-actions">
                        <Button type="button" variant="ghost" textSize="s" textColor="lightGray" fullWidth onClick={onClose}>Нет, разберусь сам</Button>
                        <Button type="button" variant="solid" textSize="s" fullWidth onClick={() => setStep(steps[0])}>Да</Button>
                    </div>
                </div>
            </Modal>
        )
    }

    const {question, hints} = STEP_CONTENT[step]
    const stepNumber = steps.indexOf(step) + 1
    const canSubmit =
        step === 'title' ? !!title.trim() :
        step === 'subtitle' ? !!subtitle.trim() :
        step === 'image' ? !!imageFile :
        !!link.trim()

    return (
        <Modal title={`Шаг ${stepNumber} из ${steps.length}`} onClose={onClose}>
            <form className="admin-profile-edit" onSubmit={submit}>
                <Text size="m" color="white">{question}</Text>

                <HintCarousel key={step} hints={hints} />

                {step === 'title' && (
                    <Input placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
                )}
                {step === 'subtitle' && (
                    <Input placeholder="Описание" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                )}
                {step === 'image' && (
                    <div className="admin-profile-image-row">
                        <ImagePicker
                            file={imageFile}
                            fallbackSrc={resolveAssetUrl(store.image) || null}
                            onChange={setImageFile}
                            shape="circle"
                            size={96}
                            label="Выбрать фото"
                        />
                    </div>
                )}
                {step === 'link' && (
                    <Input placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
                )}

                {error && <Text size="xs" color="accent">{error}</Text>}

                <div className="admin-onboarding-actions">
                    <Button type="button" variant="ghost" textSize="s" textColor="lightGray" fullWidth onClick={goNext} disabled={saving}>Пропустить</Button>
                    <Button type="submit" variant="solid" textSize="s" fullWidth disabled={saving || !canSubmit}>
                        {saving ? 'Сохранение…' : stepNumber === steps.length ? 'Готово' : 'Далее'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
