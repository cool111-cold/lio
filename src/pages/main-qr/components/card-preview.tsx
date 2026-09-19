import { Suspense } from "react"
import { Canvas, extend } from "@react-three/fiber"
import { OrbitControls, useTexture } from "@react-three/drei"
import { RoundedBoxGeometry } from "three-stdlib"

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

interface CardMeshProps {
    image: string;
}

const CardMesh = ({image}: CardMeshProps) => {
    const texture = useTexture(image)

    return (
        <mesh>
            <roundedBoxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH, 4, CARD_RADIUS]} />
            <meshStandardMaterial attach="material-0" color="#161616" roughness={0.5} metalness={0.2} />
            <meshStandardMaterial attach="material-1" color="#161616" roughness={0.5} metalness={0.2} />
            <meshStandardMaterial attach="material-2" color="#161616" roughness={0.5} metalness={0.2} />
            <meshStandardMaterial attach="material-3" color="#161616" roughness={0.5} metalness={0.2} />
            <meshStandardMaterial attach="material-4" map={texture} roughness={0.35} metalness={0.1} />
            <meshStandardMaterial attach="material-5" color="#0c0c0c" roughness={0.55} metalness={0.2} />
        </mesh>
    )
}

interface CardPreviewProps {
    image: string;
}

export const CardPreview = ({image}: CardPreviewProps) => {
    return (
        <Canvas frameloop="demand" camera={{position: [0, 0, 2.6], fov: 30}}>
            <ambientLight intensity={0.55} />
            <directionalLight position={[3, 4, 5]} intensity={1.2} />
            <directionalLight position={[-4, -2, 2]} intensity={0.35} color="#A8E10C" />
            <pointLight position={[0, 2, -3]} intensity={0.4} />
            <Suspense fallback={null}>
                <CardMesh image={image} />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
    )
}
