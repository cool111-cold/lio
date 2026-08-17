import { Button } from "../button";
import vIcon from "../../assets/icons/v-icon.svg";
import './style.css';

export const Header = () => {
    return (
        <div className="header">
            <Button onClick={() => null} icon={vIcon} />
            <Button onClick={() => null} icon={vIcon} iconStyle={{transform: 'rotate(180deg)'}} />
        </div>
    )
}