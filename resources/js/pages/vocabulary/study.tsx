import { useState, useEffect, useRef } from 'react'
import AppLayout from '@/layouts/app-layout'
import { Head, Link } from '@inertiajs/react'
import { X, Volume2, Check, ArrowRight, Mic } from 'lucide-react'
import './vocabulary.css'

type Mode = 'mcq_en_es' | 'mcq_es_en' | 'cloze' | 'type' | 'speak'

interface Card {
    word: string
    translation: string
    part_of_speech?: string
    example?: string
    example_translation?: string
    phonetic?: string
    theme: string
    is_new: boolean
    mode: Mode
    options?: string[]
    answer: string
    cloze?: string
}

interface PageProps {
    cards: Card[]
    theme: string | null
}

// ── Text-to-speech del navegador ───────────────────────────────────────────────
function speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.95

    const voices = window.speechSynthesis.getVoices()
    const bestVoice =
        voices.find(v => v.name.includes('Online (Natural)')) ||
        voices.find(v => v.name === 'Google US English') ||
        voices.find(v => v.name === 'Samantha') ||
        voices.find(v => v.lang === 'en-US')

    if (bestVoice) u.voice = bestVoice

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
}

// ── Registro de respuesta ───────────────────────────────────────────────────
function getCookie(name: string): string {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
    return m ? decodeURIComponent(m.pop() as string) : ''
}

const recordAnswer = async (word: string, correct: boolean) => {
    try {
        await fetch('/vocabulary/answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
            },
            body: JSON.stringify({ word, correct }),
        })
    } catch (error) {
        console.error('Error recording answer', error)
    }
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:"']/g, '')

// ¿El navegador soporta reconocimiento de voz?
const speechSupported = () =>
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

const MAX_SPEAK_TRIES = 3

export default function VocabularyStudy({ cards }: PageProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [phase, setPhase] = useState<'intro' | 'question' | 'feedback'>(
        cards[0]?.is_new ? 'intro' : 'question',
    )

    const [typed, setTyped] = useState('')
    const [wasCorrect, setWasCorrect] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    // Estado de reconocimiento de voz
    const [isListening, setIsListening] = useState(false)
    const [heardText, setHeardText] = useState('')
    const [speakTries, setSpeakTries] = useState(0)
    const micSupported = useRef(speechSupported())

    const [correctCount, setCorrectCount] = useState(0)
    const [done, setDone] = useState(cards.length === 0)

    const card = cards[currentIndex]

    useEffect(() => {
        // Solo en la intro reproducimos la palabra; nunca en modo speak (sería la respuesta)
        if (phase === 'intro' && card) speak(card.word)
    }, [phase, currentIndex])

    const handleGrade = (value: string) => {
        if (isProcessing || phase === 'feedback') return
        setIsProcessing(true)

        const ok = norm(value) === norm(card.answer)
        setWasCorrect(ok)
        if (ok) setCorrectCount(c => c + 1)

        recordAnswer(card.word, ok)
        setPhase('feedback')
        setIsProcessing(false)
    }

    const nextCard = () => {
        const nextIndex = currentIndex + 1
        if (nextIndex >= cards.length) {
            setDone(true)
            return
        }
        setCurrentIndex(nextIndex)
        setTyped('')
        setHeardText('')
        setSpeakTries(0)
        setPhase(cards[nextIndex].is_new ? 'intro' : 'question')
    }

    // ── Reconocimiento de voz ──
    const startListening = () => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) return

        const recognition = new SpeechRecognition()
        recognition.lang = 'en-US'
        recognition.interimResults = false
        recognition.maxAlternatives = 3

        recognition.onstart = () => {
            setIsListening(true)
            setHeardText('')
        }

        recognition.onresult = (event: any) => {
            // Revisa todas las alternativas: con que una coincida, cuenta como acierto
            const alts: string[] = Array.from(event.results[0]).map((r: any) => r.transcript)
            setHeardText(alts[0])

            const expected = norm(card.word)
            const matched = alts.some(a => {
                const spoken = norm(a)
                return spoken === expected || spoken.split(' ').includes(expected)
            })

            if (matched) {
                handleGrade(card.answer) // ✓ pronunciación correcta → avanza
            } else {
                setSpeakTries(t => t + 1) // ✗ no avanza, debe reintentar
                setIsListening(false)
            }
        }

        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)

        recognition.start()
    }

    // ── Pantalla final ──
    if (done) {
        const pct = cards.length ? Math.round((correctCount / cards.length) * 100) : 0
        return (
            <AppLayout breadcrumbs={[{ title: 'Vocabulary', href: '/vocabulary' }]}>
                <Head title="Vocabulary" />
                <div className="vb">
                    <div className="vb-done">
                        {cards.length === 0 ? (
                            <>
                                <div className="vb-done-emoji">☕</div>
                                <div className="vb-done-title">Nada que estudiar</div>
                                <div className="vb-done-sub">No hay palabras nuevas ni repasos pendientes por ahora.</div>
                            </>
                        ) : (
                            <>
                                <div className="vb-done-emoji">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
                                <div className="vb-done-title">¡Sesión completa!</div>
                                <div className="vb-done-score">{correctCount} de {cards.length} correctas ({pct}%)</div>
                                <div className="vb-done-sub">Las palabras volverán para repaso según las vayas dominando.</div>
                            </>
                        )}
                        <div className="vb-done-actions">
                            <Link href="/vocabulary" className="vb-done-btn primary">Volver a temas</Link>
                        </div>
                    </div>
                </div>
            </AppLayout>
        )
    }

    const progressPct = (currentIndex / cards.length) * 100
    const isMcq = card.mode.startsWith('mcq')
    const promptIsWord = card.mode === 'mcq_en_es'

    return (
        <AppLayout breadcrumbs={[{ title: 'Vocabulary', href: '/vocabulary' }]}>
            <Head title="Estudiando" />

            <div className="vb-study">
                {/* Barra superior */}
                <div className="vb-top">
                    <Link href="/vocabulary" className="vb-close" aria-label="Salir"><X size={18} /></Link>
                    <div className="vb-progress">
                        <div className="vb-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="vb-counter">{currentIndex + 1} / {cards.length}</div>
                </div>

                {/* ─── INTRO (palabra nueva) ─── */}
                {phase === 'intro' && (
                    <div className="vb-card">
                        <div className="vb-new-tag">Nueva palabra</div>
                        <div className="vb-word-row">
                            <div className="vb-word">{card.word}</div>
                            <button className="vb-speak" onClick={() => speak(card.word)} aria-label="Escuchar">
                                <Volume2 size={18} />
                            </button>
                        </div>
                        {card.phonetic && <div className="vb-phonetic">{card.phonetic}</div>}
                        {card.part_of_speech && <div className="vb-pos">{card.part_of_speech}</div>}

                        <div className="vb-divider" />

                        <div className="vb-translation">{card.translation}</div>
                        {card.example && (
                            <>
                                <div className="vb-example">“{card.example}”</div>
                                {card.example_translation && <div className="vb-example-tr">{card.example_translation}</div>}
                            </>
                        )}

                        <div className="vb-actions">
                            <button className="vb-btn vb-btn-primary" onClick={() => setPhase('question')}>
                                Continuar <ArrowRight size={17} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── PREGUNTA ─── */}
                {phase === 'question' && (
                    <div className="vb-card">
                        {isMcq && (
                            <>
                                <div className="vb-prompt-label">
                                    {promptIsWord ? 'Elige el significado' : 'Elige la palabra en inglés'}
                                </div>
                                <div className="vb-word-row">
                                    <div className="vb-word" style={{ fontSize: promptIsWord ? 40 : 32 }}>
                                        {promptIsWord ? card.word : card.translation}
                                    </div>
                                    {promptIsWord && (
                                        <button className="vb-speak" onClick={() => speak(card.word)} aria-label="Escuchar">
                                            <Volume2 size={18} />
                                        </button>
                                    )}
                                </div>
                                {promptIsWord && card.phonetic && <div className="vb-phonetic">{card.phonetic}</div>}

                                <div className="vb-options">
                                    {card.options?.map(opt => (
                                        <button key={opt} className="vb-option" disabled={isProcessing} onClick={() => handleGrade(opt)}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {card.mode === 'cloze' && (
                            <>
                                <div className="vb-prompt-label">Completa la oración</div>
                                <div
                                    className="vb-cloze-sentence"
                                    dangerouslySetInnerHTML={{ __html: (card.cloze ?? '').replace('_____', '<b>_____</b>') }}
                                />
                                <input
                                    className="vb-input"
                                    autoFocus
                                    disabled={isProcessing}
                                    value={typed}
                                    onChange={e => setTyped(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && typed.trim()) handleGrade(typed) }}
                                    placeholder="Escribe la palabra..."
                                />
                                <div className="vb-actions">
                                    <button className="vb-btn vb-btn-primary" disabled={!typed.trim() || isProcessing} onClick={() => handleGrade(typed)}>
                                        Comprobar
                                    </button>
                                </div>
                            </>
                        )}

                        {card.mode === 'type' && (
                            <>
                                <div className="vb-prompt-label">Escribe en inglés</div>
                                <div className="vb-translation" style={{ marginBottom: 6 }}>{card.translation}</div>
                                {card.example_translation && (
                                    <div className="vb-example-tr" style={{ marginBottom: 16 }}>{card.example_translation}</div>
                                )}
                                <input
                                    className="vb-input"
                                    autoFocus
                                    disabled={isProcessing}
                                    value={typed}
                                    onChange={e => setTyped(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && typed.trim()) handleGrade(typed) }}
                                    placeholder="Type the word..."
                                />
                                <div className="vb-actions">
                                    <button className="vb-btn vb-btn-primary" disabled={!typed.trim() || isProcessing} onClick={() => handleGrade(typed)}>
                                        Comprobar
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ─── MODO PRONUNCIACIÓN ─── */}
                        {card.mode === 'speak' && (
                            <>
                                <div className="vb-prompt-label">Pronuncia la palabra en inglés</div>
                                <div className="vb-speak-prompt">{card.translation}</div>
                                {card.example_translation && (
                                    <div className="vb-example-tr" style={{ textAlign: 'center', marginTop: 4 }}>
                                        {card.example_translation}
                                    </div>
                                )}

                                {micSupported.current ? (
                                    <div className="vb-mic-wrap">
                                        <button
                                            className={`vb-mic ${isListening ? 'listening' : ''}`}
                                            onClick={startListening}
                                            disabled={isListening || isProcessing}
                                            aria-label="Hablar"
                                        >
                                            <Mic size={38} />
                                        </button>

                                        <div className="vb-mic-status">
                                            {isListening ? (
                                                <span className="vb-mic-live">Escuchando…</span>
                                            ) : heardText ? (
                                                <>Escuché: <b>“{heardText}”</b></>
                                            ) : (
                                                'Toca el micrófono y di la palabra'
                                            )}
                                        </div>

                                        {heardText && !isListening && (
                                            <div className="vb-mic-retry">
                                                No suena del todo bien. ¡Inténtalo otra vez! ({speakTries}/{MAX_SPEAK_TRIES})
                                            </div>
                                        )}

                                        {/* Tras varios intentos, dejamos ver la respuesta y seguir (cuenta como fallo) */}
                                        {speakTries >= MAX_SPEAK_TRIES && (
                                            <button className="vb-mic-skip" onClick={() => handleGrade('')}>
                                                Ver respuesta y continuar
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    // Fallback: el navegador no soporta micrófono → escribir
                                    <>
                                        <div className="vb-mic-unsupported">
                                            Tu navegador no soporta el micrófono. Escribe la palabra (usa Chrome o Edge para practicar pronunciación).
                                        </div>
                                        <input
                                            className="vb-input"
                                            autoFocus
                                            disabled={isProcessing}
                                            value={typed}
                                            onChange={e => setTyped(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && typed.trim()) handleGrade(typed) }}
                                            placeholder="Type the word..."
                                        />
                                        <div className="vb-actions">
                                            <button className="vb-btn vb-btn-primary" disabled={!typed.trim() || isProcessing} onClick={() => handleGrade(typed)}>
                                                Comprobar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ─── FEEDBACK ─── */}
                {phase === 'feedback' && (
                    <div className="vb-card">
                        <div className="vb-feedback">
                            <div className={`vb-fb-icon ${wasCorrect ? 'ok' : 'no'}`}>
                                {wasCorrect ? <Check size={32} /> : <X size={32} />}
                            </div>
                            <div className={`vb-fb-title ${wasCorrect ? 'ok' : 'no'}`}>
                                {wasCorrect ? '¡Correcto!' : 'Casi'}
                            </div>

                            <div className="vb-fb-answer">
                                {card.word} <small>— {card.translation}</small>
                                <button className="vb-speak" style={{ display: 'inline-flex', marginLeft: 8, verticalAlign: 'middle' }} onClick={() => speak(card.word)} aria-label="Escuchar">
                                    <Volume2 size={16} />
                                </button>
                            </div>
                            {card.example && <div className="vb-fb-example">“{card.example}”</div>}
                        </div>

                        <div className="vb-actions">
                            <button className="vb-btn vb-btn-primary" autoFocus onClick={nextCard}>
                                {currentIndex + 1 >= cards.length ? 'Terminar' : 'Siguiente'} <ArrowRight size={17} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
