import { RefObject, useEffect, useRef } from "react"

interface AsciiBackgroundProps {
    color: string;
    avoidRef?: RefObject<HTMLElement | null>;
}

const RAMP = ' .\'`,:;-~+='
const CELL_WIDTH = 11
const CELL_HEIGHT = 18
const FONT_SIZE = 18
const FRAME_INTERVAL = 55
const DENSITY_THRESHOLD = 0.8
const AVOID_PADDING = 100
const AVOID_FEATHER = 70

// плазма из наложенных синусоид — своя реализация, без внешних библиотек шума
const noiseValue = (x: number, y: number, t: number) => {
    const nx = x * 0.02
    const ny = y * 0.02
    const v =
        Math.sin(nx + t) +
        Math.sin(ny * 1.3 - t * 0.7) +
        Math.sin((nx + ny) * 0.8 + t * 0.5) +
        Math.sin(Math.sqrt(nx * nx + ny * ny) * 2 - t * 1.2)
    return (v + 4) / 8
}

export const AsciiBackground = ({color, avoidRef}: AsciiBackgroundProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const parent = canvas?.parentElement
        if (!canvas || !parent) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let cols = 0
        let rows = 0
        let animationFrame = 0
        let lastDraw = 0

        const resize = () => {
            const {clientWidth, clientHeight} = parent
            canvas.width = clientWidth
            canvas.height = clientHeight
            cols = Math.ceil(clientWidth / CELL_WIDTH)
            rows = Math.ceil(clientHeight / CELL_HEIGHT)
            ctx.font = `${FONT_SIZE}px monospace`
            ctx.textBaseline = 'top'
        }

        resize()
        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(parent)

        const draw = (time: number) => {
            animationFrame = requestAnimationFrame(draw)
            if (time - lastDraw < FRAME_INTERVAL) return
            lastDraw = time

            const t = time * 0.0006
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = color
            ctx.globalAlpha = 1

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const value = noiseValue(col, row, t)
                    if (value < DENSITY_THRESHOLD) continue
                    const bias = (value - DENSITY_THRESHOLD) / (1 - DENSITY_THRESHOLD)
                    const charIndex = Math.min(RAMP.length - 1, Math.floor(bias * RAMP.length))
                    const char = RAMP[charIndex]
                    if (char === ' ') continue
                    ctx.fillText(char, col * CELL_WIDTH, row * CELL_HEIGHT)
                }
            }

            // вырезаем область под карточкой формы (с растушёванным краем), чтобы текст оставался читаемым
            if (avoidRef?.current) {
                const canvasRect = canvas.getBoundingClientRect()
                const cardRect = avoidRef.current.getBoundingClientRect()
                ctx.save()
                ctx.filter = `blur(${AVOID_FEATHER}px)`
                ctx.globalCompositeOperation = 'destination-out'
                ctx.fillStyle = 'rgba(0, 0, 0, 1)'
                ctx.fillRect(
                    cardRect.left - canvasRect.left - AVOID_PADDING,
                    cardRect.top - canvasRect.top - AVOID_PADDING,
                    cardRect.width + AVOID_PADDING * 2,
                    cardRect.height + AVOID_PADDING * 2,
                )
                ctx.restore()
            }
        }

        animationFrame = requestAnimationFrame(draw)

        return () => {
            cancelAnimationFrame(animationFrame)
            resizeObserver.disconnect()
        }
    }, [color])

    return <canvas ref={canvasRef} className="saro-login-ascii" />
}
