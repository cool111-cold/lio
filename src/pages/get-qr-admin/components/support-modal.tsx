import { Text, Button } from "../../../components"
import { Modal } from "./modal"
// стили модалки лежат в общем файле админки — подключаем, чтобы работало и вне неё
import '../style.css'

const SUPPORT_EMAIL = 'v79740240@gmail.com'
const SUPPORT_TELEGRAM_URL = 'https://t.me/vapira_vlink?direct'

interface SupportModalProps {
    onClose: () => void;
}

export const SupportModal = ({onClose}: SupportModalProps) => (
    <Modal title="Поддержка" onClose={onClose}>
        <Text size="s" color="lightGray">Если что-то не работает или есть вопрос — напишите нам, ответим как можно скорее</Text>
        <Button type="button" variant="solid" fullWidth textSize="s" onClick={() => window.open(SUPPORT_TELEGRAM_URL, '_blank', 'noopener,noreferrer')}>Написать в Telegram</Button>
        <Button type="button" variant="outline" fullWidth textSize="s" onClick={() => window.location.assign(`mailto:${SUPPORT_EMAIL}`)}>Написать на почту</Button>
        <Text size="xs" color="lightGray">{SUPPORT_EMAIL}</Text>
    </Modal>
)
