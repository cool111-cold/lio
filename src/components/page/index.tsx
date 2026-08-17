import { ReactNode } from 'react'
import './style.css'

type PageComponentProps = {
    center?: boolean;
    children?: ReactNode;
}

export const PageComponent = ({center = true, children}: PageComponentProps) => {
    const positionStyle = center ? {alignItems: 'center', justifyContent: 'center'} : {};

    return (
        <div className='page' style={positionStyle}>
            {children}
        </div>
    )
}

