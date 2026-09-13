import { ReactNode, useEffect, useRef, useState } from 'react';
import { Text } from '../text';
import './style.css';

interface SectionProps {
    id?: string;
    eyebrow?: string;
    title?: string;
    children?: ReactNode;
    className?: string;
}

export const Section = ({id, eyebrow, title, children, className}: SectionProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            {threshold: 0.2}
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div id={id} ref={ref} className={`section ${visible ? 'section-visible' : ''} ${className || ''}`}>
            {(eyebrow || title) && (
                <div className="section-heading">
                    {eyebrow && <Text size="xs" color="lightGray">{eyebrow}</Text>}
                    {title && <Text size="l">{title}</Text>}
                </div>
            )}
            <div className="section-body">{children}</div>
        </div>
    );
};
