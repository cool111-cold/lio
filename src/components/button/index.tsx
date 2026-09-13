import { CSSProperties } from "react";
import { Text, Size, TextColor } from "../text"
import './style.css'

type ButtonVariant = 'ghost' | 'solid' | 'outline';

interface ButtonProps {
    children?: string;
    onClick?: () => void;
    icon?: string;
    iconStyle?: CSSProperties;
    variant?: ButtonVariant;
    fullWidth?: boolean;
    type?: 'button' | 'submit';
    disabled?: boolean;
    textColor?: TextColor;
    textSize?: Size;
}

const DEFAULT_TEXT_COLOR: Record<ButtonVariant, TextColor> = {
    ghost: 'white',
    solid: 'onAccent',
    outline: 'primary',
}

export const Button = ({children, onClick, icon, iconStyle, variant = 'ghost', fullWidth, type = 'button', disabled, textColor, textSize = 'xl'}: ButtonProps) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`button button-${variant}${fullWidth ? ' button-full' : ''}`}
        >
            {icon && <img src={icon} alt="" className="button-icon" style={iconStyle} />}
            {children && <Text size={textSize} color={textColor ?? DEFAULT_TEXT_COLOR[variant]}>{children}</Text>}
        </button>
    )
}
