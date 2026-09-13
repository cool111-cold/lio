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
    filter?: string[];
    searchResults?: SearchResults;
    searchQuery?: string;
    sources?: MessageSource[];
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

interface QueryFile {
    id: number | string;
    text: string;
    score?: number;
    metadata: {
        file: string;
        page?: number;
        chunk?: number;
        hash?: string;
    };
}

interface DeepSearchResponse {
    result: DeepSearchChunk[];
    chat_id?: number;
}

interface AssistantQueryResponse {
    role?: 'assistant';
    text: string;
    files?: QueryFile[];
    chat_id?: number;
    name?: string;
}

interface MessageSource {
    fileName: string;
    sourceIndex: number;
    chunk?: number;
    page?: number;
    text?: string;
}

type QueryResponse = DeepSearchResponse | SearchResults | AssistantQueryResponse
type WrappedQueryResponse = QueryResponse | string | {message?: unknown; answer?: unknown; data?: unknown}

interface ChatDBMessage {
    role: 'user' | 'assistant';
    text: unknown;
    filter?: unknown;
    files?: unknown;
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

const isAssistantQueryResponse = (value: unknown): value is AssistantQueryResponse =>
    typeof value === 'object'
    && value !== null
    && 'text' in value
    && typeof (value as {text?: unknown}).text === 'string'

const usedChunkPattern = /\n*\s*\*\*Использован фрагмент:\*\*\s*Chunk\s+(\d+)\s*$/i
const inlineChunkPattern = /<<chunk\s+([\d,\s]+)>>/gi
const inlineNumericChunkPattern = /<<\s*([\d,\s]+)\s*>>/g
const sourcesLinePattern = /\n*\s*Источники:\s*<<chunk\s+[\d,\s]+>>\s*$/i
const numericSourcesLinePattern = /\n*\s*Источники:\s*<<\s*[\d,\s]+\s*>>\s*$/i

const unwrapQueryResponse = (data: WrappedQueryResponse): unknown => {
    if (isSearchResults(data) || isDeepSearchResponse(data) || isAssistantQueryResponse(data)) return data
    if (typeof data !== 'object' || data === null) return data

    const wrapped = data as {message?: unknown; answer?: unknown; data?: unknown}

    if (wrapped.message !== undefined) {
        const message = unwrapQueryResponse(wrapped.message as WrappedQueryResponse)
        if (isAssistantQueryResponse(message) && message.files === undefined && 'files' in wrapped) {
            return {...message, files: (wrapped as {files?: QueryFile[]}).files}
        }
        if (typeof message === 'string' && 'files' in wrapped) {
            return {text: message, files: (wrapped as {files?: QueryFile[]}).files}
        }
        return message
    }

    if (wrapped.answer !== undefined) {
        const answer = unwrapQueryResponse(wrapped.answer as WrappedQueryResponse)
        if (isAssistantQueryResponse(answer) && answer.files === undefined && 'files' in wrapped) {
            return {...answer, files: (wrapped as {files?: QueryFile[]}).files}
        }
        if (typeof answer === 'string' && 'files' in wrapped) {
            return {text: answer, files: (wrapped as {files?: QueryFile[]}).files}
        }
        return answer
    }

    if (wrapped.data !== undefined) return unwrapQueryResponse(wrapped.data as WrappedQueryResponse)

    return data
}

const parseResponseBody = async (res: Response): Promise<WrappedQueryResponse> => {
    const raw = await res.text()
    if (!raw.trim()) return ''

    try {
        return JSON.parse(raw) as WrappedQueryResponse
    } catch {
        return raw
    }
}

const getReferencedChunkIndexes = (text: string) => {
    const indexes: number[] = []
    const oldStyleMatch = text.match(usedChunkPattern)
    if (oldStyleMatch) indexes.push(Number(oldStyleMatch[1]))

    Array.from(text.matchAll(inlineChunkPattern)).forEach((match) => {
        match[1]
            .split(',')
            .map((item) => Number(item.trim()))
            .filter((index) => Number.isInteger(index))
            .forEach((index) => indexes.push(index))
    })

    Array.from(text.matchAll(inlineNumericChunkPattern)).forEach((match) => {
        match[1]
            .split(',')
            .map((item) => Number(item.trim()))
            .filter((index) => Number.isInteger(index))
            .forEach((index) => indexes.push(index))
    })

    return Array.from(new Set(indexes))
}

const parseUsedChunk = (text: string) => {
    const indexes = getReferencedChunkIndexes(text)

    return {
        text: text
            .replace(usedChunkPattern, '')
            .replace(sourcesLinePattern, '')
            .replace(numericSourcesLinePattern, '')
            .replace(inlineChunkPattern, '')
            .replace(inlineNumericChunkPattern, '')
            .trim(),
        indexes,
    }
}

const normalizeMessageText = (text: unknown): string => {
    if (typeof text === 'string') return parseUsedChunk(text).text
    if (text === null || text === undefined) return ''

    if (isSearchResults(text)) return getSearchSummary(text)

    if (isAssistantQueryResponse(text)) return normalizeMessageText(text.text)

    if (isDeepSearchResponse(text) && Array.isArray(text.result)) {
        return text.result.map((chunk) => chunk.text).join('\n\n') || 'Ничего не найдено'
    }

    if (typeof text === 'object' && 'text' in text) {
        return normalizeMessageText((text as {text?: unknown}).text)
    }

    return JSON.stringify(text)
}

const normalizeFilter = (filter: unknown): string[] => {
    if (!Array.isArray(filter)) return []
    return filter.filter((fileName): fileName is string => typeof fileName === 'string')
}

const normalizeQueryFiles = (files: unknown): QueryFile[] => {
    if (!Array.isArray(files)) return []

    return files.filter((file): file is QueryFile =>
        typeof file === 'object'
        && file !== null
        && 'text' in file
        && 'metadata' in file
        && typeof (file as {text?: unknown}).text === 'string'
        && typeof (file as {metadata?: {file?: unknown}}).metadata?.file === 'string'
    )
}

const getSourcesFromFiles = (text: unknown, files: unknown): MessageSource[] => {
    const rawText = typeof text === 'string'
        ? text
        : isAssistantQueryResponse(text)
            ? text.text
            : ''
    const sourceIndexes = parseUsedChunk(rawText).indexes
    const normalizedFiles = normalizeQueryFiles(files)

    return sourceIndexes.reduce<MessageSource[]>((sources, sourceIndex) => {
        const sourceFile = normalizedFiles[sourceIndex]
        if (!sourceFile) return sources

        sources.push({
                fileName: sourceFile.metadata.file,
                sourceIndex,
                chunk: sourceFile.metadata.chunk,
                page: sourceFile.metadata.page,
                text: sourceFile.text,
        })

        return sources
    }, [])
}

const toMessages = (chat: ChatDB): Message[] =>
    (chat.messages ?? []).map((message, index, messages) => {
        const previousUserMessage = [...messages.slice(0, index)].reverse().find((item) => item.role === 'user')
        const messageFiles = isAssistantQueryResponse(message.text) ? message.text.files : message.files

        return {
            id: Number(`${chat.id}${index}`),
            author: message.role === 'user' ? 'user' : 'assistant',
            text: normalizeMessageText(message.text),
            filter: normalizeFilter(message.filter),
            searchResults: isSearchResults(message.text) ? message.text : undefined,
            searchQuery: isSearchResults(message.text) ? normalizeMessageText(previousUserMessage?.text) : undefined,
            sources: getSourcesFromFiles(message.text, messageFiles),
        }
    })

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

        const filterFiles = [...selectedFilterFiles]
        setSearchQuery(query)
        setSearching(true)
        setMessages((prev) => [...prev, {id: Date.now(), author: 'user', text: query, filter: filterFiles}])
        setDraft('')

        authorizedFetch(getSearchUrl(query, currentChatId, filterFiles), {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.json())
            .then((data: SearchResults) => {
                setSearchResults(data)
                if (data.chat_id !== undefined) setCurrentChatId(data.chat_id)
                setMessages((prev) => [...prev, {
                    id: Date.now() + 1,
                    author: 'assistant',
                    text: getSearchSummary(data),
                    searchResults: data,
                    searchQuery: query,
                }])
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
        const filterFiles = [...selectedFilterFiles]
        let gotResponse = false
        setQuerying(true)

        authorizedFetch(getDeepSearchUrl(query, currentChatId, filterFiles), {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then(parseResponseBody)
            .then((data: WrappedQueryResponse) => {
                gotResponse = true
                try {
                    const response = unwrapQueryResponse(data)

                    if (isSearchResults(response)) {
                        if (response.chat_id !== undefined) setCurrentChatId(response.chat_id)
                        setMessages((prev) => [...prev, {
                            id: Date.now(),
                            author: 'assistant',
                            text: getSearchSummary(response),
                            searchResults: response,
                            searchQuery: query,
                        }])
                        refreshChats()
                        return
                    }

                    if (isAssistantQueryResponse(response)) {
                        if (response.chat_id !== undefined) setCurrentChatId(response.chat_id)
                        setMessages((prev) => [...prev, {
                            id: Date.now(),
                            author: 'assistant',
                            text: normalizeMessageText(response.text),
                            sources: getSourcesFromFiles(response.text, response.files),
                        }])
                        refreshChats()
                        return
                    }

                    if (isDeepSearchResponse(response)) {
                        const text = (response.result ?? []).map((chunk) => chunk.text).join('\n\n')
                        if (response.chat_id !== undefined) setCurrentChatId(response.chat_id)
                        setMessages((prev) => [...prev, {id: Date.now(), author: 'assistant', text: text || 'Ничего не найдено'}])
                        refreshChats()
                        return
                    }

                    setMessages((prev) => [...prev, {id: Date.now(), author: 'assistant', text: normalizeMessageText(response) || 'Ничего не найдено'}])
                    refreshChats()
                } catch {
                    setMessages((prev) => [...prev, {id: Date.now(), author: 'assistant', text: normalizeMessageText(data) || 'Ничего не найдено'}])
                    refreshChats()
                }
            })
            .catch(() => {
                if (gotResponse) return
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

        setMessages((prev) => [...prev, {id: Date.now(), author: 'user', text, filter: [...selectedFilterFiles]}])
        setDraft('')
        runQuery(text)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            sendMessage()
        }
    }

    const renderMessageFilters = (filter?: string[]) => {
        if (!filter?.length) return null

        return (
            <div className="chat-message-filter-list">
                {filter.map((fileName) => (
                    <button
                        className="chat-message-filter-chip"
                        key={fileName}
                        type="button"
                        onClick={() => openFile(fileFromName(fileName))}
                    >
                        <Text size="xs" color="primary">{fileName}</Text>
                    </button>
                ))}
            </div>
        )
    }

    const renderMessageSearchResults = (message: Message) => {
        const results = message.searchResults
        if (!results) return null

        const query = message.searchQuery ?? ''

        return (
            <div className="chat-search-results">
                <Text size="xs" color="secondary">{query ? `Результаты поиска: «${query}»` : 'Результаты поиска'}</Text>

                {results.named_files.length === 0 && results.texts.length === 0 ? (
                    <Text size="s" color="secondary">{'Ничего не найдено'}</Text>
                ) : (
                    <>
                        {results.named_files.length > 0 && (
                            <div className="chat-search-section">
                                <Text size="xs" color="lightGray">{'СОВПАДЕНИЯ В НАЗВАНИЯХ'}</Text>
                                <div className="chat-search-file-list">
                                    {results.named_files.map((name) => (
                                        <button
                                            className={`chat-search-file-card${selectedFilterFiles.includes(name) ? ' chat-search-file-card-selected' : ''}`}
                                            key={name}
                                            type="button"
                                            onClick={() => handleFileClick(fileFromName(name), query)}
                                        >
                                            <span className="chat-search-file-ext">
                                                <Text size="xs" color="accent">{getExt(name)}</Text>
                                            </span>
                                            <Text size="xs" color="primary">{name}</Text>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.texts.length > 0 && (
                            <div className="chat-search-section">
                                <Text size="xs" color="lightGray">{'СОВПАДЕНИЯ В ТЕКСТЕ'}</Text>
                                <div className="chat-search-text-list">
                                    {results.texts.map((match, i) => (
                                        <button
                                            className={`chat-search-text-card${selectedFilterFiles.includes(match.file) ? ' chat-search-text-card-selected' : ''}`}
                                            key={`${match.file}-${i}`}
                                            type="button"
                                            onClick={() => handleFileClick(fileFromName(match.file), query)}
                                        >
                                            <Text size="xs" color="accent">{match.file}</Text>
                                            <span className="jost saro-search-excerpt">{highlightExcerpt(match.text, query)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        )
    }

    const renderMessageSources = (sources?: MessageSource[]) => {
        if (!sources?.length) return null

        return (
            <div className="chat-message-source-list">
                {sources.map((source) => (
                    <button
                        className="chat-message-source-card"
                        key={`${source.fileName}-${source.sourceIndex}`}
                        type="button"
                        onClick={() => openFile(fileFromName(source.fileName), source.text)}
                    >
                        <span className="chat-search-file-ext">
                            <Text size="xs" color="accent">{getExt(source.fileName)}</Text>
                        </span>
                        <div className="chat-message-source-body">
                            <Text size="xs" color="primary">{source.fileName}</Text>
                            <Text
                                size="xs"
                                color="secondary"
                            // >{`Фрагмент ${source.sourceIndex}${source.chunk !== undefined ? `, chunk ${source.chunk}` : ''}${source.page !== undefined ? `, стр. ${source.page}` : ''}`}</Text>
                            >{`${source.page !== undefined ? `стр. ${source.page}` : ''}`}</Text>
                            {source.text && <span className="jost chat-message-source-excerpt">{source.text}</span>}
                        </div>
                    </button>
                ))}
            </div>
        )
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
                                {/* <div className="chat-day-divider">
                                    <span className="chat-day-line" />
                                    <Text size="xs" color="lightGray">{'СЕГОДНЯ'}</Text>
                                    <span className="chat-day-line" />
                                </div> */}

                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`chat-message-group chat-message-group-${message.author}${message.searchResults ? ' chat-message-group-search-results' : ''}`}
                                    >
                                        <div className="chat-message-meta">
                                            <Text size="xs" color="primary">{message.author === 'user' ? 'Я' : 'saro'}</Text>
                                            {/* <Text size="xs" color="lightGray">{'•  только что'}</Text> */}
                                        </div>

                                        {message.author === 'user' ? (
                                            <>
                                                <div className="chat-message-bubble">
                                                    <Text size="s" color="primary">{message.text}</Text>
                                                </div>
                                                {renderMessageFilters(message.filter)}
                                            </>
                                        ) : (
                                            <>
                                                {message.searchResults ? renderMessageSearchResults(message) : (
                                                    <div className="chat-message-text">
                                                        <Text size="s" color="primary">{message.text}</Text>
                                                    </div>
                                                )}
                                                {renderMessageSources(message.sources)}
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
