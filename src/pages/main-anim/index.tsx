import { useEffect, useRef, useState } from "react"
import { PageComponent, Text} from "../../components"
import gsap from "gsap";
// import { useGSAP } from '@gsap/react'
import { SplitText } from "gsap/all";
import './style.css'

interface Line {
    color: string
}

interface LineProps {
    lines: Line[]
}

const LineComponent = ({lines}: LineProps) => {
    return (
        <>
            {
                lines.map((line) => (
                    <div className="line" style={{width: `${100 / lines.length}%`, backgroundColor: line?.color}}></div>
                ))
            }        
        </>
    )
}

const Card = () => {
    const cardRef = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={cardRef}
            className="cardgame"
            onMouseEnter={() => gsap.to(cardRef.current, {y: -100, duration: 0.3, ease: 'power2.out'})}
            onMouseLeave={() => gsap.to(cardRef.current, {y: 100, duration: 0.3, ease: 'power2.out'})}
        ></div>
    )
}

const Heand = () => {
    const cards = [1,2,3,4]
    return (
        <div className="cards-container">
            {cards.map((index, card) => (
                <Card key={index}/>
            ))}
        </div>
    )
}

export const MainAnimPage = () => {
    const [headerText, setHeaderText] = useState('Your turn')

    useEffect(()=> {
        const splith = new SplitText('.title', {type: 'chars, words', })
        const splits = new SplitText('.subtitle', {type: 'lines', })

        const tl = gsap.timeline()

        tl.from(splith.chars, {
            yPercent: 100,
            duration: 1.8,
            ease: 'expo.out',
            stagger: 0.06
        }).fromTo('.title', {
            y: 0,
            fontSize: '15rem'
        }, 
        {
            y: '-45vh',
            fontSize: '5rem',
            duration: 1.3,
            content: 'ходи'
        });

        gsap.from(splits.lines, {
            opacity: 0,
            yPercent: 100,
            duration: 1.8,
            ease: 'expo.out',
            stagger: 0.06,
            delay: 2.5
        })

        gsap.fromTo('.cardgame', {x: '-100vw'}, {x: 0, delay: 1.5, duration: 0.6, stagger: 0.2, ease: 'power2.out'})

        // gsap.from(splith.chars, {
        //     yPercent: 100,
        //     duration: 1.8,
        //     ease: 'expo.out',
        //     stagger: 0.06
        // })

        // gsap.fromTo('.title', {
        //     y: 0,
        //     fontSize: '15rem'
        // }, 
        // {
        //     y: -200,
        //     fontSize: '5rem'
        // })
    },[])
    return (
        <PageComponent>
            <>
                <div className="title">{"VAPIRA"}</div>
                <div className="subtitle">{headerText}</div>
            </>
            <Heand />
            {/* <>
                <LineComponent lines={[{'color': '#000'}, {'color': '#000'}]} />
            </> */}
        </PageComponent>
    )
}