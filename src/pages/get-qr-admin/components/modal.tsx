import { ReactNode, useEffect } from "react"
import { Text } from "../../../components"

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export const Modal = ({title, onClose, children}: ModalProps) => {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <Text size="l" color="white">{title}</Text>
                    <button type="button" className="admin-modal-close" aria-label="Закрыть" onClick={onClose}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                            <path d="M2 2l8 8M10 2l-8 8" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
