import React, { useState, useRef, useEffect, useCallback } from 'react'
import { router } from '@inertiajs/react'
import ReactMarkdown from 'react-markdown'
import './placement.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface User {
    id: number
    name: string
    email: string
}

interface PlacementProps {
    user: User
}

interface StreamChunk {
    text?: string
    done?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_EXCHANGES = 15

// ─── Send icon ────────────────────────────────────────────────────────────────

function SendIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
        </svg>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Placement({ user }: PlacementProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState<string>('')
    const [streaming, setStreaming] = useState<boolean>(false)
    const [thinking, setThinking] = useState<boolean>(false)
    const [exchanges, setExchanges] = useState<number>(0)
    const [analyzing, setAnalyzing] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [isFinished, setIsFinished] = useState<boolean>(false)

    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, thinking])

    useEffect(() => {
        if (!streaming && !thinking && !analyzing && !isFinished) {
            inputRef.current?.focus()
        }
    }, [streaming, thinking, analyzing, isFinished])

    useEffect(() => {
        sendToAI([])
    }, [])

    const sendToAI = useCallback(async (msgs: Message[]) => {
        setThinking(true)
        setError(null)

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? ''

            const response = await fetch((window as any).route('placement.chat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify({ messages: msgs }),
            })

            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            if (!response.body) throw new Error('No response body')

            setThinking(false)
            setStreaming(true)
            setMessages(prev => [...prev, { role: 'assistant', content: '' }])

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue

                    const raw = line.slice(6).trim()
                    if (!raw) continue

                    try {
                        const chunk = JSON.parse(raw) as StreamChunk

                        if (chunk.text) {
                            setMessages(prev => {
                                const updated = [...prev]
                                let newText = updated[updated.length - 1].content + chunk.text

                                if (newText.includes('[EVALUATION_READY]')) {
                                    newText = newText.replace('[EVALUATION_READY]', '')
                                    setIsFinished(true)

                                    setTimeout(() => {
                                        setAnalyzing(true)
                                        const finalMessages = [...updated]
                                        finalMessages[finalMessages.length - 1].content = newText
                                        completePlacement(finalMessages)
                                    }, 2000)
                                }
                                updated[updated.length - 1] = {
                                    role: 'assistant',
                                    content: newText,
                                }
                                return updated
                            })
                        }

                        if (chunk.done) {
                            reader.cancel()
                            break
                        }
                    } catch {
                        // Chunk malformado — ignorar
                    }
                }
            }
        } catch (err) {
            setThinking(false)
            setError('Something went wrong. Please try again.')
            console.error('Placement stream error:', err)
        } finally {
            setStreaming(false)
        }
    }, [])

    // ── El usuario envía un mensaje ──────────────────────────────────────────
    async function handleSend() {
        if (!input.trim() || streaming || thinking || analyzing || isFinished) return

        const userMsg: Message = { role: 'user', content: input.trim() }
        const updated = [...messages, userMsg]
        const newExchanges = exchanges + 1

        setMessages(updated)
        setInput('')
        setExchanges(newExchanges)

        await sendToAI(updated)
    }

    function completePlacement(finalMessages: Message[]) {
        router.post(
            (window as any).route('placement.complete'),
            { messages: finalMessages as any },
            { preserveState: false }
        )
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const isInputActive = !streaming && !thinking && !analyzing && !isFinished && exchanges < MAX_EXCHANGES
    const progress = Math.min((exchanges / MAX_EXCHANGES) * 100, 100)

    return (
        <div className="placement-root">

            {/* ── Header ── */}
            <header className="pl-header">
                <div className="pl-logo">
                    <div className="pl-logo-dot" />
                    Capuchino
                </div>
                <span className="pl-step-label">Level Assessment</span>
            </header>

            {!analyzing ? (
                <>
                    {/* ── Progress ── */}
                    <div className="pl-progress-wrap">
                        <div className="pl-progress-labels">
                            <span>Getting to know you</span>
                            <span>{exchanges} of {MAX_EXCHANGES}</span>
                        </div>
                        <div className="pl-progress-track">
                            <div
                                className="pl-progress-fill"
                                style={{ width: `${progress}%` }}
                                role="progressbar"
                                aria-valuenow={exchanges}
                                aria-valuemax={MAX_EXCHANGES}
                            />
                        </div>
                    </div>

                    {/* ── Messages ── */}
                    <div className="pl-messages" aria-live="polite" aria-label="Conversation">

                        {messages.map((msg, i) =>
                            msg.role === 'assistant' ? (
                                <div key={i} className="pl-msg-ai">
                                    <div className="pl-avatar" aria-hidden="true">A</div>
                                    <div className="pl-bubble-ai">
                                        <div className="markdown-chat">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                        {streaming && i === messages.length - 1 && (
                                            <span className="pl-cursor" aria-hidden="true" />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div key={i} className="pl-msg-user">
                                    <div className="pl-bubble-user"><div className="markdown-chat">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div></div>
                                </div>
                            )
                        )}

                        {/* Indicador de "pensando" */}
                        {thinking && (
                            <div className="pl-msg-ai">
                                <div className="pl-avatar" aria-hidden="true">A</div>
                                <div className="pl-bubble-ai">
                                    <div className="pl-dots" aria-label="Alex is typing">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error inline */}
                        {error && (
                            <div className="pl-msg-ai">
                                <div className="pl-avatar" aria-hidden="true">A</div>
                                <div className="pl-bubble-ai" style={{ color: '#C4622D' }}>
                                    {error}
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* ── Input ── */}
                    {isInputActive && (
                        <div className="pl-input-wrap">
                            <div className="pl-input-inner">
                                <input
                                    ref={inputRef}
                                    className="pl-input"
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your message..."
                                    aria-label="Your message"
                                    maxLength={600}
                                />
                                <button
                                    className="pl-send-btn"
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    aria-label="Send message"
                                >
                                    <SendIcon />
                                </button>
                            </div>
                            <p className="pl-hint">Press Enter to send</p>
                        </div>
                    )}
                </>
            ) : (
                /* ── Analyzing screen ── */
                <div className="pl-analyzing" aria-live="polite">
                    <div className="pl-analyzing-dots" aria-hidden="true">
                        <span /><span /><span />
                    </div>
                    <p className="pl-analyzing-title">Analyzing your level</p>
                    <p className="pl-analyzing-sub">
                        Give us a moment — Alex is crafting your personalized study plan.
                    </p>
                </div>
            )}

        </div>
    )
}
