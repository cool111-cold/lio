import './style.css'
import { colors } from '../../helpers';
import { useState, useEffect } from 'react';
import { TextAnimate } from 'react-text-animator';


export type Size = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
export type TextColor = 'white' | 'dark' | 'gray' | 'lightGray' | 'primary' | 'secondary' | 'accent' | 'onAccent';

interface TextProps {
    children: string;
    color?: TextColor;
    size?: Size;
    animation?: boolean
}

const Sizes = {
    'xs': 12,
    's': 14,
    'm': 16,
    'l': 22,
    'xl': 32,
    'xxl': 42
}

const Colors: Record<TextColor, string> = {
    'white': colors.white,
    'dark': colors.black,
    'gray': colors.gray,
    'lightGray': colors.lightGray,
    // тема (светлая/тёмная) задаётся через CSS-переменную на обёртке страницы
    'primary': 'var(--lio-text)',
    'secondary': colors.secondary,
    'accent': colors.accent,
    'onAccent': colors.bgDark,
}



export const Text = ({children, color = 'white', size = 'm', animation}: TextProps) => {
    const localStyles = {
        color: Colors[color],
        fontSize: Sizes[size]
    }
    if (animation) {
        return <TextAnimate animation={'fadeIn'} className='jost' style={localStyles}>{children}</TextAnimate>
        // return <TextAnimate duration={2} animation={'typewriter'} className='jost' style={localStyles}>{children}</TextAnimate>
    }
    
    return <p className='jost' style={localStyles}>{children}</p>
}