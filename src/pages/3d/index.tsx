import { useEffect, useState } from "react"
import { PageComponent, Text, Header } from "../../components"
import { Cube, CubeFace } from "./components/cube"
import { getText } from "../../helpers"
import cubeBackgroundImg from '../../assets/img/2.jpg'
import cubeBackgroundImg3 from '../../assets/img/6.jpg'
import cubeBackgroundImg4 from '../../assets/img/4.jpg'
import cubeBackgroundImg5 from '../../assets/img/5.jpg'
import cubeBackgroundImg7 from '../../assets/img/7.jpg'
import cubeBackgroundImg8 from '../../assets/img/8.jpg'



const FACE_IMAGES: Record<CubeFace, string> = {
    right: cubeBackgroundImg7,
    left: cubeBackgroundImg3,
    top: cubeBackgroundImg4,
    bottom: cubeBackgroundImg5,
    front: cubeBackgroundImg,
    back: cubeBackgroundImg8,
}

const FACE_IMAGE_URLS = Array.from(new Set(Object.values(FACE_IMAGES)))
const TEXTS = ['Покрути куб', 'Каждая сторона свой фон', 'Креативное использование 3D в дизайне?', 'Можешь перемещаться по слайдам с помощью VɅ сверху экрана']

const TextComponent = ({index} : {index: number}) => {

    return (
        <div style={{position: 'absolute', top: '50%', left: 42, width: '30%', zIndex: 2, transform: "translateY(-50%)"}}>
            {/* <Text size='xl' animation>{getText('cubeLabel')}</Text> */}

            <Text size='l' animation >{index > TEXTS.length-1 ? TEXTS[TEXTS.length-1] : TEXTS[index]}</Text>
        </div>
    )
}

const SlideComponent = () => {

    return (
        <div style={{position: 'absolute', bottom: 42, right: 42, zIndex: 2}}>
            <Text size='xl' animation >{'Слайд 1: 3D'}</Text>
        </div>
    )
}

export const ThreeDPage = () => {
    const [alignedFace, setAlignedFace] = useState<CubeFace | null>(null);
    const [index, setIndex] = useState(-1);
    useEffect(() => {
        setIndex((e) => e + 0.5)
    },[alignedFace])

    return (
        <PageComponent>
            <Header />
            <div style={{position: 'relative', zIndex: 1, width: '100%', height: '100%'}}>
                <Cube
                    onFaceAlignedChange={setAlignedFace}
                    backgroundUrls={FACE_IMAGE_URLS}
                    activeBackgroundUrl={alignedFace ? FACE_IMAGES[alignedFace] : null}
                />
            </div>
            {!alignedFace && <TextComponent index={index} />}
            {!alignedFace && <SlideComponent />} 
            {/* первый слайд */}
        </PageComponent>
    )
}
