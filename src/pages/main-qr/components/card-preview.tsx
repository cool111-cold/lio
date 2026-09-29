import { Suspense, useEffect, useRef, useState } from "react"
import { Canvas, extend, useFrame } from "@react-three/fiber"
import { OrbitControls, useTexture } from "@react-three/drei"
import { RoundedBoxGeometry } from "three-stdlib"
import type { Mesh } from "three"

extend({ RoundedBoxGeometry })

declare module "@react-three/fiber" {
    interface ThreeElements {
        roundedBoxGeometry: any;
    }
}

const CARD_WIDTH = 1.6
const CARD_HEIGHT = 1
const CARD_DEPTH = 0.07
const CARD_RADIUS = 0.06

// половина переворота в секундах: карта встаёт ребром, меняет рисунок и возвращается
const FLIP_HALF_DURATION = 0.28

interface CardMeshProps {
    images: string[];
    activeIndex: number;
}

const CardMesh = ({images, activeIndex}: CardMeshProps) => {
    const textures = useTexture(images)
    const meshRef = useRef<Mesh>(null)
    const [shownIndex, setShownIndex] = useState(activeIndex)
    const flip = useRef<{phase: 'out' | 'in'; progress: number} | null>(null)
    const targetIndex = useRef(activeIndex)
    const shownIndexRef = useRef(activeIndex)

    useEffect(() => {
        targetIndex.current = activeIndex
        if (activeIndex !== shownIndexRef.current && !flip.current) {
            flip.current = {phase: 'out', progress: 0}
        }
    }, [activeIndex])

    useFrame((state, delta) => {
        const mesh = meshRef.current
        if (!mesh) return

        const t = state.clock.getElapsedTime()
        mesh.position.y = Math.sin(t * 1.2) * 0.025
        mesh.rotation.x = Math.sin(t * 0.8) * 0.05
        const sway = Math.sin(t * 0.6) * 0.12

        if (!flip.current) {
            mesh.rotation.y = sway
            return
        }

        flip.current.progress = Math.min(1, flip.current.progress + delta / FLIP_HALF_DURATION)
        const eased = 1 - Math.pow(1 - flip.current.progress, 3)

        if (flip.current.phase === 'out') {
            mesh.rotation.y = sway + eased * (Math.PI / 2)
            if (flip.current.progress === 1) {
                shownIndexRef.current = targetIndex.current
                setShownIndex(targetIndex.current)
                flip.current = {phase: 'in', progress: 0}
            }
        } else {
            mesh.rotation.y = sway - Math.PI / 2 + eased * (Math.PI / 2)
            if (flip.current.progress === 1) {
                flip.current = targetIndex.current !== shownIndexRef.current ? {phase: 'out', progress: 0} : null
            }
        }
    })

    return (
        <mesh ref={meshRef}>
            <roundedBoxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH, 4, CARD_RADIUS]} />
            <meshStandardMaterial attach="material-0" color="#161616" roughness={0.5} metalness={0.2} />
            <meshStandardMaterial attach="material-1" color="#161616" roughness={0.5} metalness={0.2} />
            <meshStandardMaterial attach="material-2" color="#161616" roughness={0.5} metalness={0.2} />
            <meshStandardMaterial attach="material-3" color="#161616" roughness={0.5} metalness={0.2} />
            <meshStandardMaterial attach="material-4" map={textures[shownIndex]} roughness={0.35} metalness={0.1} />
            <meshStandardMaterial attach="material-5" color="#0c0c0c" roughness={0.55} metalness={0.2} />
        </mesh>
    )
}

interface CardPreviewProps {
    images: string[];
    activeIndex: number;
    // false — сцена за пределами экрана, кадры не рендерим
    active?: boolean;
}

export const CardPreview = ({images, activeIndex, active = true}: CardPreviewProps) => {
    return (
        <Canvas frameloop={active ? 'always' : 'never'} camera={{position: [0, 0, 3.3], fov: 30}}>
            <ambientLight intensity={0.55} />
            <directionalLight position={[3, 4, 5]} intensity={1.2} />
            <directionalLight position={[-4, -2, 2]} intensity={0.35} color="#A8E10C" />
            <pointLight position={[0, 2, -3]} intensity={0.4} />
            <Suspense fallback={null}>
                <CardMesh images={images} activeIndex={activeIndex} />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
    )
}
