export interface ComponentSource {
    file: string;
    code: string;
}

export const COMPONENT_SOURCES: Record<string, ComponentSource> = {
    Text: {
        file: 'src/components/text/index.tsx',
        code: `import './style.css'
import { colors } from '../../helpers';
import { useState, useEffect } from 'react';
import { TextAnimate } from 'react-text-animator';


type Size = 'xs' | 's' | 'm' | 'l' | 'xl';

interface TextProps {
    children: string;
    color?: 'white' | 'dark' | 'gray' | 'lightGray';
    size?: Size;
    animation?: boolean
}

const Sizes = {
    'xs': -5,
    's': 5,
    'm': 10,
    'l': 15,
    'xl': 25
}

const Colors = {
    'white': colors.white,
    'dark': colors.black,
    'gray': colors.gray,
    'lightGray': colors.lightGray
}

export const Text = ({children, color = 'white', size = 'm', animation}: TextProps) => {
    const width = window.innerWidth;
    const headth = window.innerHeight;

    const localStyles = {
        color: Colors[color],
        fontSize: width / 100 + headth / 100 + Sizes[size]
    }
    if (animation) {
        return <TextAnimate animation={'fadeIn'} className='jost' style={localStyles}>{children}</TextAnimate>
    }

    return <p className='jost' style={localStyles}>{children}</p>
}`,
    },
    Button: {
        file: 'src/components/button/index.tsx',
        code: `import { CSSProperties } from "react";
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
}`,
    },
    Tag: {
        file: 'src/components/tag/index.tsx',
        code: `import './style.css';

export const Tag = ({children}: {children: string}) => {
    return <span className="tag">{children}</span>;
};`,
    },
    Card: {
        file: 'src/components/card/index.tsx',
        code: `import { Text } from '../text';
import { Tag } from '../tag';
import './style.css';

interface CardProps {
    image?: string;
    title: string;
    description?: string;
    tags?: string[];
    action?: string;
    onClick?: () => void;
}

export const Card = ({image, title, description, tags, action, onClick}: CardProps) => {
    return (
        <div className="card" onClick={onClick}>
            {image && (
                <div className="card-image-wrapper">
                    <img className="card-image" src={image} alt={title} />
                    <div className="card-image-overlay" />
                </div>
            )}
            <div className="card-body">
                <Text size="m">{title}</Text>
                {description && <Text size="xs" color="lightGray">{description}</Text>}
                {tags && tags.length > 0 && (
                    <div className="card-tags">
                        {tags.map((t) => <Tag key={t}>{t}</Tag>)}
                    </div>
                )}
                {action && (
                    <div className="card-action">
                        <Text size="xs">{\`\${action} →\`}</Text>
                    </div>
                )}
            </div>
        </div>
    );
};`,
    },
    Section: {
        file: 'src/components/section/index.tsx',
        code: `import { ReactNode, useEffect, useRef, useState } from 'react';
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
        <div id={id} ref={ref} className={\`section \${visible ? 'section-visible' : ''} \${className || ''}\`}>
            {(eyebrow || title) && (
                <div className="section-heading">
                    {eyebrow && <Text size="xs" color="lightGray">{eyebrow}</Text>}
                    {title && <Text size="l">{title}</Text>}
                </div>
            )}
            <div className="section-body">{children}</div>
        </div>
    );
};`,
    },
    Header: {
        file: 'src/components/header/index.tsx',
        code: `import { Button } from "../button";
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
}`,
    },
    PageComponent: {
        file: 'src/components/page/index.tsx',
        code: `import { ReactNode } from 'react'
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
}`,
    },
};
