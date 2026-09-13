import { InputHTMLAttributes, useId, useState } from "react";
import { Text } from "../text"
import './style.css'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    secureToggle?: boolean;
}

export const Input = ({label, error, secureToggle, type = 'text', id, ...rest}: InputProps) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [visible, setVisible] = useState(false);
    const resolvedType = secureToggle ? (visible ? 'text' : 'password') : type;

    return (
        <div className="input-group">
            {label && (
                <div className="input-label">
                    <Text size="xs" color="secondary">{label}</Text>
                </div>
            )}
            <div className={`input-wrapper${error ? ' input-wrapper-error' : ''}`}>
                <input id={inputId} type={resolvedType} className="input-field jost" {...rest} />
                {secureToggle && (
                    <button type="button" className="input-toggle" tabIndex={-1} onClick={() => setVisible((v) => !v)}>
                        <Text size="xs" color="accent">{visible ? 'Скрыть' : 'Показать'}</Text>
                    </button>
                )}
            </div>
            {error && <Text size="xs" color="accent">{error}</Text>}
        </div>
    )
}
