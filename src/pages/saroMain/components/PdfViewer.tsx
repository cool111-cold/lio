import { useEffect, useRef, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import "pdfjs-dist/web/pdf_viewer.css"
import "./pdfViewer.css"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString()

const PAGE_SCALE = 1.4
const MIN_SNIPPET_WORDS = 8
const FALLBACK_DIV_SPAN = 10

const normalizeText = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ')

const getSnippetIndex = (text: string, phrase: string) => {
    const exactIndex = text.indexOf(phrase)
    if (exactIndex !== -1) return {index: exactIndex, length: phrase.length}

    const words = phrase.split(/\s+/).filter((word) => word.length > 2)
    if (words.length < MIN_SNIPPET_WORDS) return null

    for (let size = Math.min(18, words.length); size >= MIN_SNIPPET_WORDS; size--) {
        for (let start = 0; start <= words.length - size; start += Math.max(1, Math.floor(size / 2))) {
            const snippet = words.slice(start, start + size).join(' ')
            const index = text.indexOf(snippet)

            if (index !== -1) return {index, length: snippet.length}
        }
    }

    return null
}

const applyHighlight = (divs: HTMLElement[], strs: string[], highlight: string) => {
    const phrase = normalizeText(highlight)
    if (!phrase) return

    const words = Array.from(new Set(phrase.split(/\s+/).filter((word) => word.length > 2)))
    const normalizedStrs = strs.map(normalizeText)

    let matched: number[] = []

    const offsets: number[] = []
    let pos = 0
    normalizedStrs.forEach((s) => {
        offsets.push(pos)
        pos += s.length + 1
    })
    const text = normalizedStrs.join(' ')
    const snippetMatch = getSnippetIndex(text, phrase)

    if (snippetMatch) {
        const end = snippetMatch.index + snippetMatch.length
        matched = normalizedStrs
            .map((_, i) => i)
            .filter((i) => offsets[i] < end && offsets[i] + normalizedStrs[i].length > snippetMatch.index)
    }

    if (!matched.length) {
        const firstMatch = normalizedStrs.findIndex((s) => words.some((w) => s.includes(w)))
        if (firstMatch !== -1) {
            matched = normalizedStrs
                .map((_, i) => i)
                .filter((i) => i >= firstMatch && i < firstMatch + FALLBACK_DIV_SPAN)
        }
    }

    if (!matched.length) return

    matched.forEach((i) => divs[i]?.classList.add('saro-pdf-highlight'))
    divs[matched[0]]?.scrollIntoView({behavior: 'smooth', block: 'center'})
}

interface PdfViewerProps {
    url: string;
    highlight?: string | null;
}

export const PdfViewer = ({url, highlight}: PdfViewerProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        let cancelled = false
        const loadingTask = pdfjsLib.getDocument({url})

        setLoading(true)
        setError(false)

        const run = async () => {
            const doc = await loadingTask.promise
            if (cancelled) return

            const container = containerRef.current
            if (!container) return
            container.innerHTML = ''

            const allDivs: HTMLElement[] = []
            const allStrs: string[] = []

            for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
                if (cancelled) return

                const page = await doc.getPage(pageNum)
                const viewport = page.getViewport({scale: PAGE_SCALE})
                const dpr = window.devicePixelRatio || 1

                const pageEl = document.createElement('div')
                pageEl.className = 'saro-pdf-page'
                pageEl.style.width = `${viewport.width}px`
                pageEl.style.height = `${viewport.height}px`

                const canvas = document.createElement('canvas')
                canvas.width = Math.floor(viewport.width * dpr)
                canvas.height = Math.floor(viewport.height * dpr)
                canvas.style.width = `${viewport.width}px`
                canvas.style.height = `${viewport.height}px`
                pageEl.appendChild(canvas)

                const textLayerDiv = document.createElement('div')
                textLayerDiv.className = 'textLayer'
                pageEl.appendChild(textLayerDiv)

                container.appendChild(pageEl)

                const ctx = canvas.getContext('2d')
                if (!ctx) continue
                if (dpr !== 1) ctx.scale(dpr, dpr)

                await page.render({canvas, canvasContext: ctx, viewport}).promise
                if (cancelled) return

                const textContent = await page.getTextContent()
                const textLayer = new pdfjsLib.TextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport,
                })
                await textLayer.render()
                if (cancelled) return

                allDivs.push(...textLayer.textDivs)
                allStrs.push(...textLayer.textContentItemsStr)
            }

            if (cancelled) return
            setLoading(false)

            if (highlight) {
                applyHighlight(allDivs, allStrs, highlight)
            }
        }

        run().catch(() => {
            if (!cancelled) {
                setLoading(false)
                setError(true)
            }
        })

        return () => {
            cancelled = true
            loadingTask.destroy()
        }
    }, [url, highlight])

    return (
        <div className="saro-pdf-viewer">
            {loading && (
                <div className="saro-pdf-viewer-loading">
                    <span className="saro-main-file-spinner" />
                </div>
            )}
            {error && !loading && (
                <div className="saro-pdf-viewer-loading">
                    <span>{'Не удалось отобразить файл'}</span>
                </div>
            )}
            <div className="saro-pdf-viewer-scroll" ref={containerRef} />
        </div>
    )
}
