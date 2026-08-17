import { CSSProperties } from "react";
import { Text } from "../text"
import './style.css'


interface ButtonProps {
    children?: string;
    onClick: () => void;
    icon?: string;
    iconStyle?: CSSProperties;
}

export const Button = ({children, onClick, icon, iconStyle}: ButtonProps) => {
    return (
        <div onClick={onClick} className="button">
            {icon && <img src={icon} alt="" className="button-icon" style={iconStyle} />}
            {children && <Text size='xl'>{children}</Text>}
        </div>
    )
}