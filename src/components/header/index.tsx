import { Button } from "../button";
import vIcon from "../../assets/icons/v-icon.svg";
import './style.css';

interface HeaderProps {
    onLeftClick?: () => void;
    onRightClick?: () => void;
}

export const Header = ({onLeftClick, onRightClick}: HeaderProps = {}) => {
    return (
        <div className="header">
            <Button onClick={() => onLeftClick?.()} icon={vIcon} />
            <Button onClick={() => onRightClick?.()} icon={vIcon} iconStyle={{transform: 'rotate(180deg)'}} />
        </div>
    )
}