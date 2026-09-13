import { RefObject, useEffect, useRef } from "react"

interface AsciiBackgroundProps {
    color: string;
    avoidRef?: RefObject<HTMLElement | null>;
}

const CHAR = '+'
const CELL_WIDTH = 22
const CELL_HEIGHT = 32
const FONT_SIZE = 18
const FRAME_INTERVAL = 55
const AVOID_PADDING = 100
const AVOID_FEATHER = 70

const BASE_ALPHA = 0.16
const WAVE_ALPHA = 1
const WAVE_SPEED_PX = 280 // скорость движения волны, px/сек
const WAVE_PERIOD_RATIO = 1.8 // расстояние между волнами относительно ширины экрана — держит на экране только одну волну разом
const WAVE_WIDTH_RATIO = 0.3 // ширина самой волны относительно периода
const WAVE_SHARPNESS = 1.3 // чем больше, тем чётче выделен гребень волны

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
        let wavePeriod = 0
        let waveHalfWidth = 0
        let animationFrame = 0
        let lastDraw = 0

        const resize = () => {
            const {clientWidth, clientHeight} = parent
            canvas.width = clientWidth
            canvas.height = clientHeight
            cols = Math.ceil(clientWidth / CELL_WIDTH)
            rows = Math.ceil(clientHeight / CELL_HEIGHT)
            wavePeriod = clientWidth * WAVE_PERIOD_RATIO
            waveHalfWidth = (wavePeriod * WAVE_WIDTH_RATIO) / 2
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

            const t = time * 0.001
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = color

            const travel = t * WAVE_SPEED_PX

            for (let row = 0; row < rows; row++) {
                const py = row * CELL_HEIGHT
                for (let col = 0; col < cols; col++) {
                    const px = col * CELL_WIDTH
                    // одна волна на период: считаем расстояние по x до её центра (с учётом зацикливания)
                    const local = ((px - travel) % wavePeriod + wavePeriod) % wavePeriod
                    const distFromCenter = Math.min(local, wavePeriod - local)
                    const pulse = distFromCenter < waveHalfWidth
                        ? Math.cos((distFromCenter / waveHalfWidth) * (Math.PI / 2)) ** WAVE_SHARPNESS
                        : 0
                    ctx.globalAlpha = BASE_ALPHA + pulse * (WAVE_ALPHA - BASE_ALPHA)
                    ctx.fillText(CHAR, px, py)
                }
            }

            // вырезаем область под карточкой формы (с растушёванным краем), чтобы текст оставался читаемым
            if (avoidRef?.current) {
                const canvasRect = canvas.getBoundingClientRect()
                const cardRect = avoidRef.current.getBoundingClientRect()
                ctx.save()
                ctx.filter = `blur(${AVOID_FEATHER}px)`
                ctx.globalAlpha = 1
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
