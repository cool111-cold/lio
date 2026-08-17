import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Billboard, Center, Environment, MeshTransmissionMaterial, OrbitControls, RoundedBox, Text3D, useTexture, useVideoTexture } from "@react-three/drei"
import { Mesh, MeshBasicMaterial, PerspectiveCamera, Plane, Texture, Vector3 } from "three"
import { colors, getText } from "../../../helpers"

const FACE_ALIGNMENT_THRESHOLD = 0.995
const BACKDROP_DEPTH = 15

export type CubeFace = 'right' | 'left' | 'top' | 'bottom' | 'front' | 'back'

const CUBE_SIZE = 2.5
const CUBE_HALF_SIZE = CUBE_SIZE / 2

const cubeClippingPlanes = [
    new Plane(new Vector3(-0.95, 0, 0), CUBE_HALF_SIZE),
    new Plane(new Vector3(0.95, 0, 0), CUBE_HALF_SIZE),
    new Plane(new Vector3(0, -0.95, 0), CUBE_HALF_SIZE),
    new Plane(new Vector3(0, 0.95, 0), CUBE_HALF_SIZE),
    new Plane(new Vector3(0, 0, -0.95), CUBE_HALF_SIZE),
    new Plane(new Vector3(0, 0, 0.95), CUBE_HALF_SIZE),
]

const GlassCube = () => {
    return (
        <>
            <Billboard>
                <Center>
                    <Text3D
                        font="/fonts/helvetiker_bold.typeface.json"
                        size={0.8}
                        height={0.15}
                        curveSegments={12}
                        bevelEnabled
                        bevelThickness={0.02}
                        bevelSize={0.02}
                        bevelSegments={5}
                        lineHeight={0.8}
                    >
                        {'pirava \n vapira \n ravapi'}
                        <meshStandardMaterial color={colors.cubeText} clippingPlanes={cubeClippingPlanes} />
                    </Text3D>
                </Center>
            </Billboard>
            <RoundedBox
                args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]}
                radius={0.1}
                smoothness={4}
            >
                <MeshTransmissionMaterial
                    thickness={0.6}
                    roughness={0.05}
                    transmission={1}
                    ior={1.5}
                    chromaticAberration={0.04}
                    anisotropy={0.2}
                    distortion={0.1}
                    distortionScale={0.3}
                    temporalDistortion={0.1}
                    backside
                />
            </RoundedBox>
        </>
    )
}

const BACKDROP_FADE_SPEED = 6
const BACKDROP_HEIGHT_RATIO = 0.9
const BACKDROP_ZOOM = 1.3
const BACKDROP_PAN_SPEED = 0.08

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg)$/i.test(url)

type VideoBackdropTextureProps = {
    url: string
    onTexture: (url: string, texture: Texture) => void
}

const VideoBackdropTexture = ({ url, onTexture }: VideoBackdropTextureProps) => {
    const texture = useVideoTexture(url)

    useEffect(() => {
        onTexture(url, texture)
    }, [url, texture, onTexture])

    return null
}

type BackgroundBackdropProps = {
    urls: string[]
    activeUrl: string | null
}

const BackgroundBackdrop = ({ urls, activeUrl }: BackgroundBackdropProps) => {
    const imageUrls = useMemo(() => urls.filter((url) => !isVideoUrl(url)), [urls])
    const videoUrls = useMemo(() => urls.filter(isVideoUrl), [urls])

    const imageTextures = useTexture(imageUrls)
    const [videoTextures, setVideoTextures] = useState<Record<string, Texture>>({})

    const handleVideoTexture = useCallback((url: string, texture: Texture) => {
        setVideoTextures((prev) => (prev[url] === texture ? prev : { ...prev, [url]: texture }))
    }, [])

    const texturesByUrl = useMemo(() => {
        const map = new Map<string, Texture>()
        imageUrls.forEach((url, index) => map.set(url, imageTextures[index]))
        Object.entries(videoTextures).forEach(([url, texture]) => map.set(url, texture))
        return map
    }, [imageUrls, imageTextures, videoTextures])

    const meshRef = useRef<Mesh>(null)
    const materialRef = useRef<MeshBasicMaterial>(null)
    const direction = useRef(new Vector3())

    useEffect(() => {
        const material = materialRef.current
        if (!material || !activeUrl) return

        const texture = texturesByUrl.get(activeUrl)
        if (texture) {
            texture.repeat.set(1 / BACKDROP_ZOOM, 1 / BACKDROP_ZOOM)
            material.map = texture
            material.needsUpdate = true
        }
    }, [activeUrl, texturesByUrl])

    useFrame(({ camera, clock }, delta) => {
        const mesh = meshRef.current
        if (!mesh) return

        camera.getWorldDirection(direction.current)
        mesh.position.copy(camera.position).addScaledVector(direction.current, BACKDROP_DEPTH)
        mesh.quaternion.copy(camera.quaternion)

        const perspectiveCamera = camera as PerspectiveCamera
        const height = 2 * Math.tan((perspectiveCamera.fov * Math.PI) / 360) * BACKDROP_DEPTH
        const width = height * perspectiveCamera.aspect
        mesh.scale.set(width, height * BACKDROP_HEIGHT_RATIO, 1)

        const material = materialRef.current
        if (material) {
            const targetOpacity = activeUrl ? 1 : 0
            material.opacity += (targetOpacity - material.opacity) * Math.min(delta * BACKDROP_FADE_SPEED, 1)

            if (material.map && material.opacity > 0) {
                const panRange = 1 - material.map.repeat.x
                const pan = (panRange / 2) * (1 + Math.sin(clock.elapsedTime * BACKDROP_PAN_SPEED))
                material.map.offset.x = pan
                material.map.offset.y = pan
            }
        }
    })

    return (
        <>
            {videoUrls.map((url) => (
                <VideoBackdropTexture key={url} url={url} onTexture={handleVideoTexture} />
            ))}
            <mesh ref={meshRef}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial ref={materialRef} transparent opacity={0} depthWrite={false} toneMapped={false} />
            </mesh>
        </>
    )
}

const getAlignedFace = (direction: Vector3): CubeFace | null => {
    const absX = Math.abs(direction.x)
    const absY = Math.abs(direction.y)
    const absZ = Math.abs(direction.z)
    const maxComponent = Math.max(absX, absY, absZ)

    if (maxComponent <= FACE_ALIGNMENT_THRESHOLD) {
        return null
    }

    if (maxComponent === absX) {
        return direction.x > 0 ? 'right' : 'left'
    }

    if (maxComponent === absY) {
        return direction.y > 0 ? 'top' : 'bottom'
    }

    return direction.z > 0 ? 'front' : 'back'
}

type FaceAlignmentWatcherProps = {
    onChange: (face: CubeFace | null) => void
}

const FaceAlignmentWatcher = ({ onChange }: FaceAlignmentWatcherProps) => {
    const faceRef = useRef<CubeFace | null>(null)

    useFrame(({ camera }) => {
        const direction = camera.position.clone().normalize()
        const face = getAlignedFace(direction)

        if (face !== faceRef.current) {
            faceRef.current = face
            onChange(face)
        }
    })

    return null
}

type CubeProps = {
    onFaceAlignedChange?: (face: CubeFace | null) => void
    backgroundUrls?: string[]
    activeBackgroundUrl?: string | null
}

export const Cube = ({ onFaceAlignedChange, backgroundUrls, activeBackgroundUrl }: CubeProps) => {
    return (
        <Canvas camera={{ position: [0, 2, 6], fov: 50 }} gl={{ localClippingEnabled: true }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} />
            <Environment preset='studio' />
            {backgroundUrls && backgroundUrls.length > 0 && (
                <BackgroundBackdrop urls={backgroundUrls} activeUrl={activeBackgroundUrl ?? null} />
            )}
            <GlassCube />
            <OrbitControls enableZoom={false} enablePan={false} />
            {onFaceAlignedChange && <FaceAlignmentWatcher onChange={onFaceAlignedChange} />}
        </Canvas>
    )
}