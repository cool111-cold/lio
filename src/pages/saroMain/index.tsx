import { ChangeEvent, CSSProperties, KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react"
import { PageComponent, Text, Input } from "../../components"
import { IconChevronDown, IconClose, IconCopy, IconFilter, IconLink, IconPlus, IconSend, IconThumbDown, IconThumbUp } from "./components/icons"
import { PdfViewer } from "./components/PdfViewer"
import './style.css'

type Theme = 'light' | 'dark'
type ComposerMode = 'search' | 'query'
type SidebarTab = 'files' | 'chats'

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
    chat_id?: number;
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
    chat_id?: number;
}

interface ChatDBMessage {
    role: 'user' | 'assistant';
    text: unknown;
}

interface ChatSummary {
    id: number;
    name: string;
}

interface ChatDB extends ChatSummary {
    id: number;
    user_id: number;
    name: string;
    messages: ChatDBMessage[];
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

const parseChatsResponse = (data: ChatSummary[] | {chats?: ChatSummary[]}): ChatSummary[] => {
    if (Array.isArray(data)) return data
    return data.chats ?? []
}

const parseChatResponse = (data: ChatDB | {chat?: ChatDB}): ChatDB | null => {
    if ('chat' in data) return data.chat ?? null
    if ('messages' in data) return data
    return null
}

const isSearchResults = (value: unknown): value is SearchResults =>
    typeof value === 'object'
    && value !== null
    && 'named_files' in value
    && 'texts' in value

const isDeepSearchResponse = (value: unknown): value is DeepSearchResponse =>
    typeof value === 'object'
    && value !== null
    && 'result' in value

const normalizeMessageText = (text: unknown): string => {
    if (typeof text === 'string') return text
    if (text === null || text === undefined) return ''

    if (isSearchResults(text)) return getSearchSummary(text)

    if (isDeepSearchResponse(text) && Array.isArray(text.result)) {
        return text.result.map((chunk) => chunk.text).join('\n\n') || 'Ничего не найдено'
    }

    if (typeof text === 'object' && 'text' in text) {
        return normalizeMessageText((text as {text?: unknown}).text)
    }

    return JSON.stringify(text)
}

const toMessages = (chat: ChatDB): Message[] =>
    (chat.messages ?? []).map((message, index) => ({
        id: Number(`${chat.id}${index}`),
        author: message.role === 'user' ? 'user' : 'assistant',
        text: normalizeMessageText(message.text),
    }))

const appendFilterParams = (params: URLSearchParams, filterFiles: string[]) => {
    filterFiles.forEach((fileName) => params.append('filter', fileName))
}

const getSearchUrl = (query: string, chatId: number | null, filterFiles: string[]) => {
    const params = new URLSearchParams({query})
    if (chatId !== null) params.set('chat_id', String(chatId))
    appendFilterParams(params, filterFiles)
    return `${API_BASE_URL}/search-in-files?${params.toString()}`
}

const getDeepSearchUrl = (query: string, chatId: number | null, filterFiles: string[]) => {
    const params = new URLSearchParams({query})
    if (chatId !== null) params.set('chat_id', String(chatId))
    appendFilterParams(params, filterFiles)
    return `${API_BASE_URL}/deep-search?${params.toString()}`
}

const getSearchSummary = (data: SearchResults) => {
    const filesCount = data.named_files?.length ?? 0
    const textsCount = data.texts?.length ?? 0

    if (filesCount === 0 && textsCount === 0) return 'Ничего не найдено'

    return `Найдено: файлов по названию — ${filesCount}, совпадений в тексте — ${textsCount}`
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
    onUnauthorized?: () => void;
}

export const SaroMainPage = ({token, onUnauthorized}: SaroMainPageProps) => {
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
    const [chats, setChats] = useState<ChatSummary[]>([])
    const [chatsLoading, setChatsLoading] = useState(false)
    const [chatLoadingId, setChatLoadingId] = useState<number | null>(null)
    const [currentChatId, setCurrentChatId] = useState<number | null>(null)
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files')
    const [filterMode, setFilterMode] = useState(false)
    const [selectedFilterFiles, setSelectedFilterFiles] = useState<string[]>([])

    const authorizedFetch = useCallback((input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, init).then((res) => {
            if (res.status === 401) {
                onUnauthorized?.()
                throw new Error('Unauthorized')
            }

            return res
        }), [onUnauthorized])

    const fetchFiles = useCallback(() =>
        authorizedFetch(`${API_BASE_URL}/get-files-list`, {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.json())
            .then((data: {message: string}) => parseFilesResponse(data).map(toStockFile)), [authorizedFetch, token])

    const fetchChats = useCallback(() =>
        authorizedFetch(`${API_BASE_URL}/get-chats`, {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.json())
            .then(parseChatsResponse), [authorizedFetch, token])

    const fetchChatById = useCallback((chatId: number) =>
        authorizedFetch(`${API_BASE_URL}/get-chat-by-id?chat_id=${encodeURIComponent(String(chatId))}`, {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.json())
            .then(parseChatResponse), [authorizedFetch, token])

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        setUploading(true)
        authorizedFetch(`${API_BASE_URL}/upload-file`, {
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

        setChatsLoading(true)
        fetchChats()
            .then((newChats) => {
                if (cancelled) return
                setChats(newChats)
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setChatsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [fetchChats, fetchFiles])

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

        authorizedFetch(`${API_BASE_URL}/get-file?filename=${encodeURIComponent(file.name)}`, {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.blob())
            .then((blob) => setPreviewUrl(URL.createObjectURL(blob)))
            .catch(() => {})
            .finally(() => setPreviewLoading(false))
    }

    const toggleFilterFile = (fileName: string) => {
        setSelectedFilterFiles((selectedFiles) =>
            selectedFiles.includes(fileName)
                ? selectedFiles.filter((name) => name !== fileName)
                : [...selectedFiles, fileName]
        )
    }

    const handleFileClick = (file: StockFile, highlight?: string) => {
        if (filterMode) {
            toggleFilterFile(file.name)
            return
        }

        openFile(file, highlight)
    }

    const closePreview = () => {
        setPreviewFile(null)
        setPreviewUrl(null)
        setPreviewHighlight(null)
    }


    const refreshChats = useCallback(() => {
        setChatsLoading(true)
        fetchChats()
            .then((newChats) => setChats(newChats))
            .catch(() => {})
            .finally(() => setChatsLoading(false))
    }, [fetchChats])

    const runSearch = (query: string) => {
        if (searching) return

        setSearchQuery(query)
        setSearching(true)
        setMessages((prev) => [...prev, {id: Date.now(), author: 'user', text: query}])
        setDraft('')

        authorizedFetch(getSearchUrl(query, currentChatId, selectedFilterFiles), {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.json())
            .then((data: SearchResults) => {
                setSearchResults(data)
                if (data.chat_id !== undefined) setCurrentChatId(data.chat_id)
                setMessages((prev) => [...prev, {id: Date.now() + 1, author: 'assistant', text: getSearchSummary(data)}])
                refreshChats()
            })
            .catch(() => {
                setSearchResults({named_files: [], texts: []})
                setMessages((prev) => [...prev, {id: Date.now() + 1, author: 'assistant', text: 'Не удалось выполнить поиск'}])
            })
            .finally(() => setSearching(false))
    }

    const clearSearch = () => {
        setSearchResults(null)
        setSearchQuery('')
    }

    const openChat = (chat: ChatSummary) => {
        if (chatLoadingId !== null) return

        setChatLoadingId(chat.id)
        fetchChatById(chat.id)
            .then((loadedChat) => {
                if (!loadedChat) return
                setCurrentChatId(loadedChat.id)
                setMessages(toMessages(loadedChat))
                clearSearch()
                closePreview()
            })
            .catch(() => {})
            .finally(() => setChatLoadingId(null))
    }

    const startNewChat = () => {
        setCurrentChatId(null)
        setMessages([])
        setDraft('')
        clearSearch()
        closePreview()
        setSidebarTab('chats')
    }

    const toggleFilterMode = () => {
        setFilterMode((enabled) => !enabled)
        setSidebarTab('files')
        clearSearch()
    }

    const runQuery = (query: string) => {
        setQuerying(true)

        authorizedFetch(getDeepSearchUrl(query, currentChatId, selectedFilterFiles), {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.json())
            .then((data: DeepSearchResponse) => {
                const text = (data.result ?? []).map((chunk) => chunk.text).join('\n\n')
                if (data.chat_id !== undefined) setCurrentChatId(data.chat_id)
                setMessages((prev) => [...prev, {id: Date.now(), author: 'assistant', text: text || 'Ничего не найдено'}])
                refreshChats()
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
                                placeholder={composerMode === 'search' ? "Напишите, какой файл вы ищете..." : "Напишите сообщение..."}
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
                                    <button
                                        className={`icon-btn${filterMode ? ' icon-btn-active' : ''}`}
                                        type="button"
                                        onClick={toggleFilterMode}
                                        title={selectedFilterFiles.length > 0 ? `Выбрано файлов: ${selectedFilterFiles.length}` : 'Фильтр по файлам'}
                                    >
                                        <IconFilter />
                                    </button>
                                </div>

                                <button className="chat-send-btn" type="button" onClick={sendMessage}>
                                    <Text size="xs" color="onAccent">{composerMode === 'query' ? 'Отправить' : 'Поиск'}</Text>
                                    {/* <IconSend size={13} /> */}
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
                                                        className={`saro-main-file-card${previewFile?.id === name ? ' saro-main-file-card-active' : ''}${selectedFilterFiles.includes(name) ? ' saro-main-file-card-selected' : ''}`}
                                                        key={name}
                                                        onClick={() => handleFileClick(fileFromName(name), searchQuery)}
                                                    >
                                                        <div className="saro-main-file-icon">
                                                            {previewLoading && previewFile?.id === name
                                                                ? <span className="saro-main-file-spinner" />
                                                                : <Text size="xs" color="accent">{getExt(name)}</Text>}
                                                        </div>
                                                        {selectedFilterFiles.includes(name) && <span className="saro-main-file-selected-dot" />}
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
                                                        className={`saro-search-text-card${previewFile?.id === match.file ? ' saro-search-text-card-active' : ''}${selectedFilterFiles.includes(match.file) ? ' saro-search-text-card-selected' : ''}`}
                                                        key={`${match.file}-${i}`}
                                                        onClick={() => handleFileClick(fileFromName(match.file), searchQuery)}
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
                            <div className="saro-main-tabs">
                                <button
                                    className={`saro-main-tab${sidebarTab === 'files' ? ' saro-main-tab-active' : ''}`}
                                    type="button"
                                    onClick={() => setSidebarTab('files')}
                                >
                                    <Text size="xs" color={sidebarTab === 'files' ? 'onAccent' : 'secondary'}>{'Файлы'}</Text>
                                </button>
                                <button
                                    className={`saro-main-tab${sidebarTab === 'chats' ? ' saro-main-tab-active' : ''}`}
                                    type="button"
                                    onClick={() => {
                                        setSidebarTab('chats')
                                        refreshChats()
                                    }}
                                >
                                    <Text size="xs" color={sidebarTab === 'chats' ? 'onAccent' : 'secondary'}>{'Чаты'}</Text>
                                </button>
                            </div>

                            {sidebarTab === 'files' ? (
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
                                            className={`saro-main-file-card${previewFile?.id === file.id ? ' saro-main-file-card-active' : ''}${selectedFilterFiles.includes(file.name) ? ' saro-main-file-card-selected' : ''}`}
                                            key={file.id}
                                            onClick={() => handleFileClick(file)}
                                        >
                                            <div className="saro-main-file-icon">
                                                {previewLoading && previewFile?.id === file.id
                                                    ? <span className="saro-main-file-spinner" />
                                                    : <Text size="xs" color="accent">{file.ext}</Text>}
                                            </div>
                                            {selectedFilterFiles.includes(file.name) && <span className="saro-main-file-selected-dot" />}
                                            <div className="saro-main-file-name">
                                                <Text size="xs" color="primary">{file.name}</Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="saro-main-chats">
                                    <button className="saro-main-new-chat-btn" type="button" onClick={startNewChat}>
                                        <IconPlus size={16} />
                                        <Text size="xs" color="onAccent">{'Новый чат'}</Text>
                                    </button>

                                    {chatsLoading ? (
                                        <div className="chat-empty">
                                            <span className="saro-main-file-spinner" />
                                            <Text size="s" color="secondary">{'Загрузка чатов...'}</Text>
                                        </div>
                                    ) : chats.length === 0 ? (
                                        <div className="chat-empty">
                                            <Text size="s" color="secondary">{'Чатов пока нет'}</Text>
                                        </div>
                                    ) : (
                                        <div className="saro-main-chats-list">
                                            {chats.map((chat) => (
                                                <div
                                                    className={`saro-main-chat-card${currentChatId === chat.id ? ' saro-main-chat-card-active' : ''}`}
                                                    key={chat.id}
                                                    onClick={() => openChat(chat)}
                                                >
                                                    <Text size="s" color="primary">{chat.name}</Text>
                                                    {chatLoadingId === chat.id && <Text size="xs" color="secondary">{'Загрузка...'}</Text>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </PageComponent>
    )
}
