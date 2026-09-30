import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import frameImage from '../../assets/img/iphone-frame.png';
import './style.css';

// Ширина экрана в CSS-пикселях, под которую верстается контент (iPhone 13 Pro)
const DEFAULT_SCREEN_WIDTH = 390;

interface PhoneMockupProps {
    children?: ReactNode;
    // URL страницы, которую показать в экране через iframe (вместо children)
    src?: string;
    // Ширина всего мокапа на странице
    width?: number | string;
    screenWidth?: number;
    className?: string;
}

export const PhoneMockup = ({
    children,
    src,
    width = 360,
    screenWidth = DEFAULT_SCREEN_WIDTH,
    className = '',
}: PhoneMockupProps) => {
    const screenRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ scale: 1, height: 0 });

    // Контент верстается в "настоящих" размерах телефона и масштабируется под экран мокапа
    useLayoutEffect(() => {
        const screen = screenRef.current;
        if (!screen) return;

        const update = () => {
            const scale = screen.clientWidth / screenWidth;
            setSize({ scale, height: screen.clientHeight / scale });
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(screen);
        return () => observer.disconnect();
    }, [screenWidth]);

    return (
        <div className={`phone-mockup ${className}`} style={{ width }}>
            <div className="phone-mockup__screen" ref={screenRef}>
                <div
                    className="phone-mockup__viewport"
                    style={{
                        width: screenWidth,
                        height: size.height,
                        transform: `scale(${size.scale})`,
                    }}
                >
                    {src ? <iframe className="phone-mockup__iframe" src={src} title="phone-screen" /> : children}
                </div>
            </div>
            <img className="phone-mockup__frame" src={frameImage} alt="" draggable={false} />
        </div>
    );
};
