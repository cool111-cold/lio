import { ChangeEvent, CSSProperties, KeyboardEvent, useEffect, useMemo, useState } from "react"
import { PageComponent, Text, Input } from "../../components"
import { IconChevronDown, IconClose, IconCopy, IconFilter, IconLink, IconPlus, IconSend, IconThumbDown, IconThumbUp } from "./components/icons"
import { PdfViewer } from "./components/PdfViewer"
import './style.css'

type Theme = 'light' | 'dark'
type ComposerMode = 'search' | 'query'

interface Message {
    id: number;
    author: 'user' | 'assistant';
    text: string;
}

interface StockFile {
    id: number | string;
    name: string;
    ext: string;
}

interface TextMatch {
    text: string;
    file: string;
}

interface SearchResults {
    named_files: string[];
    texts: TextMatch[];
}

interface DeepSearchChunk {
    id: number;
    text: string;
    metadata: {
        file: string;
        page: number;
        chunk: number;
        hash: string;
    };
}

interface DeepSearchResponse {
    result: DeepSearchChunk[];
}

const API_BASE_URL = 'http://localhost:8000'

const getExt = (name: string) => (name.split('.').pop() ?? '').toUpperCase()

const toStockFile = (name: string, index: number): StockFile => ({
    id: index,
    name,
    ext: getExt(name),
})

const fileFromName = (name: string): StockFile => ({
    id: name,
    name,
    ext: getExt(name),
})

const parseFilesResponse = (data: {message: string}): string[] => {
    const matches = data.message.match(/'([^']*)'|"([^"]*)"/g) ?? []
    return matches.map((m) => m.slice(1, -1))
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const highlightExcerpt = (text: string, query: string) => {
    const words = Array.from(new Set(query.trim().split(/\s+/).filter(Boolean)))
    if (!words.length) return text

    const pattern = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi')
    return text.split(pattern).map((part, i) =>
        words.some((w) => w.toLowerCase() === part.toLowerCase())
            ? <mark className="saro-search-highlight" key={i}>{part}</mark>
            : part
    )
}

const ThemeSwitch = ({theme, onToggle}: {theme: Theme, onToggle: () => void}) => {
    return (
        <div className="chat-theme-switch" onClick={onToggle}>
            <div className={`chat-theme-switch-track chat-theme-switch-track-${theme}`}>
                <div className="chat-theme-switch-thumb" />
            </div>
            <Text size="xs" color="secondary">{theme === 'light' ? 'Светлая' : 'Тёмная'}</Text>
        </div>
    )
}

interface SaroMainPageProps {
    token: string;
}

export const SaroMainPage = ({token}: SaroMainPageProps) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [draft, setDraft] = useState('')
    const [theme, setTheme] = useState<Theme>('dark')
    const [composerMode, setComposerMode] = useState<ComposerMode>('search')
    const [files, setFiles] = useState<StockFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [previewFile, setPreviewFile] = useState<StockFile | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewHighlight, setPreviewHighlight] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
    const [querying, setQuerying] = useState(false)

    const fetchFiles = () =>
        fetch(`${API_BASE_URL}/get-files-list`, {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.json())
            .then((data: {message: string}) => parseFilesResponse(data).map(toStockFile))

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        setUploading(true)
        fetch(`${API_BASE_URL}/upload-file`, {
            method: 'POST',
            headers: {Authorization: `Bearer ${token}`},
            body: formData,
        })
            .then(() => fetchFiles())
            .then((newFiles) => setFiles(newFiles))
            .catch(() => {})
            .finally(() => setUploading(false))
    }

    useEffect(() => {
        let cancelled = false

        fetchFiles()
            .then((newFiles) => {
                if (cancelled) return
                setFiles(newFiles)
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [token])

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    const openFile = (file: StockFile, highlight?: string) => {
        setPreviewFile(file)
        setPreviewUrl(null)
        setPreviewHighlight(highlight ?? null)
        setPreviewLoading(true)

        fetch(`${API_BASE_URL}/get-file?filename=${encodeURIComponent(file.name)}`, {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.blob())
            .then((blob) => setPreviewUrl(URL.createObjectURL(blob)))
            .catch(() => {})
            .finally(() => setPreviewLoading(false))
    }

    const closePreview = () => {
        setPreviewFile(null)
        setPreviewUrl(null)
        setPreviewHighlight(null)
    }


    const runSearch = (query: string) => {
        setSearchQuery(query)
        setSearching(true)

        fetch(`${API_BASE_URL}/search-in-files?query=${encodeURIComponent(query)}`, {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.json())
            .then((data: SearchResults) => setSearchResults(data))
            .catch(() => setSearchResults({named_files: [], texts: []}))
            .finally(() => setSearching(false))
    }

    const clearSearch = () => {
        setSearchResults(null)
        setSearchQuery('')
    }

    const runQuery = (query: string) => {
        setQuerying(true)

        fetch(`${API_BASE_URL}/deep-search?query=${encodeURIComponent(query)}`, {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.json())
            .then((data: DeepSearchResponse) => {
                const text = (data.result ?? []).map((chunk) => chunk.text).join('\n\n')
                setMessages((prev) => [...prev, {id: Date.now(), author: 'assistant', text: text || 'Ничего не найдено'}])
            })
            .catch(() => {
                setMessages((prev) => [...prev, {id: Date.now(), author: 'assistant', text: 'Не удалось получить ответ'}])
            })
            .finally(() => setQuerying(false))
    }

    const themeVars = useMemo(() => (theme === 'light' ? {
        '--lio-bg': '#f7f7f7',
        '--lio-text': '#1e1e1e',
        '--lio-input-bg': 'rgba(30, 30, 30, 0.03)',
        '--lio-page-bg': '#e7e7ea',
        '--lio-card-bg': '#ffffff',
        '--lio-bubble-bg': 'rgba(30, 30, 30, 0.05)',
        '--lio-hover-bg': 'rgba(0, 0, 0, 0.05)',
    } : {
        '--lio-bg': '#1e1e1e',
        '--lio-text': '#f7f7f7',
        '--lio-input-bg': 'rgba(247, 247, 247, 0.05)',
        '--lio-page-bg': '#141414',
        '--lio-card-bg': '#262626',
        '--lio-bubble-bg': 'rgba(247, 247, 247, 0.08)',
        '--lio-hover-bg': 'rgba(255, 255, 255, 0.08)',
    }) as unknown as CSSProperties, [theme])

    const sendMessage = () => {
        const text = draft.trim()
        if (!text) return

        if (composerMode === 'search') {
            runSearch(text)
            return
        }

        if (querying) return

        setMessages((prev) => [...prev, {id: Date.now(), author: 'user', text}])
        setDraft('')
        runQuery(text)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <PageComponent center={false}>
            <div className="saro-main" style={themeVars}>
                {previewFile ? (
                    <div className="saro-file-viewer">
                        <div className="chat-header">
                            <div className="chat-header-left">
                                <button className="icon-btn" type="button" onClick={closePreview}>
                                    <IconClose />
                                </button>
                                <div className="chat-header-name">
                                    <Text size="m" color="primary">{previewFile.name}</Text>
                                </div>
                            </div>
                        </div>

                        <div className="saro-file-viewer-body">
                            {previewLoading ? (
                                <div className="chat-empty">
                                    <span className="saro-main-file-spinner" />
                                    <Text size="s" color="secondary">{'Загрузка файла...'}</Text>
                                </div>
                            ) : previewUrl ? (
                                <PdfViewer url={previewUrl} highlight={previewHighlight} />
                            ) : (
                                <div className="chat-empty">
                                    <Text size="s" color="secondary">{'Не удалось загрузить файл'}</Text>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                <div className="saro-chat">
                    <div className="chat-header">
                        <div className="chat-header-left">
                            <button className="icon-btn" type="button">
                                <IconClose />
                            </button>
                            <div className="chat-avatar">
                                <Text size="xs" color="accent">{'S'}</Text>
                            </div>
                            <div className="chat-header-name">
                                <Text size="m" color="primary">{'saro'}</Text>
                                <IconChevronDown />
                            </div>
                        </div>
                        <div className="chat-header-right">
                            <ThemeSwitch theme={theme} onToggle={() => setTheme((t) => t === 'light' ? 'dark' : 'light')} />
                            <button className="icon-btn" type="button">
                                <IconLink />
                            </button>
                        </div>
                    </div>

                    <div className="chat-scroll">
                        {messages.length === 0 ? (
                            <div className="chat-empty">
                                <Text size="s" color="secondary">{'Чат пока пуст — напишите сообщение, чтобы начать'}</Text>
                            </div>
                        ) : (
                            <>
                                <div className="chat-day-divider">
                                    <span className="chat-day-line" />
                                    <Text size="xs" color="lightGray">{'СЕГОДНЯ'}</Text>
                                    <span className="chat-day-line" />
                                </div>

                                {messages.map((message) => (
                                    <div key={message.id} className={`chat-message-group chat-message-group-${message.author}`}>
                                        <div className="chat-message-meta">
                                            <Text size="xs" color="primary">{message.author === 'user' ? 'Я' : 'saro'}</Text>
                                            <Text size="xs" color="lightGray">{'•  только что'}</Text>
                                        </div>

                                        {message.author === 'user' ? (
                                            <div className="chat-message-bubble">
                                                <Text size="s" color="primary">{message.text}</Text>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="chat-message-text">
                                                    <Text size="s" color="primary">{message.text}</Text>
                                                </div>
                                                <div className="chat-message-actions">
                                                    <button className="chat-action-btn" type="button"><IconThumbUp /></button>
                                                    <button className="chat-action-btn" type="button"><IconThumbDown /></button>
                                                    <button className="chat-action-btn" type="button"><IconCopy /></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {querying && (
                                    <div className="chat-message-group chat-message-group-assistant">
                                        <div className="chat-message-meta">
                                            <Text size="xs" color="primary">{'saro'}</Text>
                                        </div>
                                        <div className="chat-message-text">
                                            <span className="saro-main-file-spinner" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="chat-composer-wrap">
                        <div className="chat-composer">
                            <Input
                                placeholder={composerMode == 'search' ? "Напишите, какой файл вы ищете..." : "Напишите сообщение..."}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />

                            <div className="chat-composer-row">
                                <div className="chat-composer-row-left">
                                    <button
                                        className={`chat-mode-btn${composerMode === 'search' ? ' chat-mode-btn-active' : ''}`}
                                        type="button"
                                        onClick={() => setComposerMode('search')}
                                    >
                                        <Text size="xs" color={composerMode === 'search' ? 'onAccent' : 'secondary'}>{'Поиск'}</Text>
                                    </button>
                                    <button
                                        className={`chat-mode-btn${composerMode === 'query' ? ' chat-mode-btn-active' : ''}`}
                                        type="button"
                                        onClick={() => setComposerMode('query')}
                                    >
                                        <Text size="xs" color={composerMode === 'query' ? 'onAccent' : 'secondary'}>{'Запрос'}</Text>
                                    </button>
                                    <button className="icon-btn" type="button">
                                        <IconFilter />
                                    </button>
                                </div>

                                <button className="chat-send-btn" type="button" onClick={sendMessage}>
                                    <Text size="xs" color="onAccent">{composerMode === 'query' ? 'Отправить' : 'Поиск'}</Text>
                                    <IconSend size={13} />
                                </button>
                            </div>
                        </div>

                        {/* <Text size="xs" color="lightGray">{'saro может ошибаться. Проверяйте важные факты.'}</Text> */}
                    </div>
                </div>
                )}

                <div className="saro-main-files">
                    {searching ? (
                        <div className="chat-empty">
                            <span className="saro-main-file-spinner" />
                            <Text size="s" color="secondary">{'Поиск...'}</Text>
                        </div>
                    ) : searchResults ? (
                        <>
                            <div className="saro-main-files-header">
                                <button className="icon-btn" type="button" onClick={clearSearch}>
                                    <IconClose />
                                </button>
                                <Text size="xs" color="secondary">{`Результаты поиска: «${searchQuery}»`}</Text>
                            </div>

                            {searchResults.named_files.length === 0 && searchResults.texts.length === 0 ? (
                                <div className="chat-empty">
                                    <Text size="s" color="secondary">{'Ничего не найдено'}</Text>
                                </div>
                            ) : (
                                <div className="saro-search-results">
                                    {searchResults.named_files.length > 0 && (
                                        <div className="saro-search-section">
                                            <Text size="xs" color="lightGray">{'СОВПАДЕНИЯ В НАЗВАНИЯХ'}</Text>
                                            <div className="saro-main-files-grid">
                                                {searchResults.named_files.map((name) => (
                                                    <div
                                                        className={`saro-main-file-card${previewFile?.id === name ? ' saro-main-file-card-active' : ''}`}
                                                        key={name}
                                                        onClick={() => openFile(fileFromName(name), searchQuery)}
                                                    >
                                                        <div className="saro-main-file-icon">
                                                            {previewLoading && previewFile?.id === name
                                                                ? <span className="saro-main-file-spinner" />
                                                                : <Text size="xs" color="accent">{getExt(name)}</Text>}
                                                        </div>
                                                        <div className="saro-main-file-name">
                                                            <Text size="xs" color="primary">{name}</Text>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {searchResults.texts.length > 0 && (
                                        <div className="saro-search-section">
                                            <Text size="xs" color="lightGray">{'СОВПАДЕНИЯ В ТЕКСТЕ'}</Text>
                                            <div className="saro-search-text-list">
                                                {searchResults.texts.map((match, i) => (
                                                    <div
                                                        className={`saro-search-text-card${previewFile?.id === match.file ? ' saro-search-text-card-active' : ''}`}
                                                        key={`${match.file}-${i}`}
                                                        onClick={() => openFile(fileFromName(match.file), searchQuery)}
                                                    >
                                                        <Text size="xs" color="accent">{match.file}</Text>
                                                        <p className="jost saro-search-excerpt">{highlightExcerpt(match.text, searchQuery)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <Text size="xs" color="secondary">{'Файлы'}</Text>
                            <div className="saro-main-files-grid">
                                <label className={`saro-main-file-card saro-main-file-card-upload${uploading ? ' saro-main-file-card-uploading' : ''}`}>
                                    <input
                                        type="file"
                                        className="saro-main-file-upload-input"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                    <div className="saro-main-file-icon">
                                        {uploading ? <span className="saro-main-file-spinner" /> : <IconPlus size={18} />}
                                    </div>
                                    <div className="saro-main-file-name">
                                        <Text size="xs" color="secondary">{uploading ? 'Загрузка...' : 'Добавить файл'}</Text>
                                    </div>
                                </label>

                                {files.map((file) => (
                                    <div
                                        className={`saro-main-file-card${previewFile?.id === file.id ? ' saro-main-file-card-active' : ''}`}
                                        key={file.id}
                                        onClick={() => openFile(file)}
                                    >
                                        <div className="saro-main-file-icon">
                                            {previewLoading && previewFile?.id === file.id
                                                ? <span className="saro-main-file-spinner" />
                                                : <Text size="xs" color="accent">{file.ext}</Text>}
                                        </div>
                                        <div className="saro-main-file-name">
                                            <Text size="xs" color="primary">{file.name}</Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </PageComponent>
    )
}
