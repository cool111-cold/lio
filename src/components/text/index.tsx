import './style.css'
import { colors } from '../../helpers';
import { useState, useEffect } from 'react';
import { TextAnimate } from 'react-text-animator';


type Size = 's' | 'm' | 'l' | 'xl';

interface TextProps {
    children: string;
    color?: 'white' | 'dark';
    size?: Size;
    animation?: boolean
}

const Sizes = {
    's': 5,
    'm': 10,
    'l': 15,
    'xl': 25
}

const Colors = {
    'white': colors.white,
    'dark': colors.black
}



export const Text = ({children, color = 'white', size = 'm', animation}: TextProps) => {
    const width = window.innerWidth;
    const headth = window.innerHeight;

    console.log(width / 100 + headth / 100)

    const localStyles = {
        color: Colors[color],
        fontSize: width / 100 + headth / 100 + Sizes[size]

    }
    if (animation) {
        return <TextAnimate animation={'fadeIn'} className='jost' style={localStyles}>{children}</TextAnimate>
        // return <TextAnimate duration={2} animation={'typewriter'} className='jost' style={localStyles}>{children}</TextAnimate>
    }
    
    return <p className='jost' style={localStyles}>{children}</p>
}