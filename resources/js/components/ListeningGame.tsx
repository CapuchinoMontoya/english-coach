import React, { useEffect, useRef, useState, useCallback } from 'react'
import './listening.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Blank {
    word:     string     // la palabra correcta
    deadline: number      // segundo límite para responder
    options:  string[]    // opciones (incluye la correcta + distractores similares)
}

interface LyricLine {
    time:  number
    end:   number
    text:  string
    blank?: Blank | null
}

interface Song {
    title:            string
    artist:           string
    youtube_video_id: string
    lines:            LyricLine[]
}

interface ListeningGameProps {
    song:        Song
    rewindSecs?: number
    graceSecs?:  number
    onComplete?: (result: { correct: number; total: number; score: number }) => void
}

type GameState = 'loading' | 'ready' | 'playing' | 'paused_miss' | 'completed'

declare global {
    interface Window {
        YT: any
        onYouTubeIframeAPIReady: () => void
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalize = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:"']/g, '')

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListeningGame({
    song,
    rewindSecs = 4,
    graceSecs  = 0.5,
    onComplete,
}: ListeningGameProps) {
    const [state,      setState]      = useState<GameState>('loading')
    const [activeLine, setActiveLine] = useState(0)
    const [answers,    setAnswers]    = useState<Record<number, string>>({})
    const [statuses,   setStatuses]   = useState<Record<number, 'pending' | 'correct' | 'missed'>>({})
    const [missedLine, setMissedLine] = useState<number | null>(null)

    const playerRef   = useRef<any>(null)
    const pollRef     = useRef<number | null>(null)
    const scrollRef   = useRef<HTMLDivElement>(null)
    const answersRef  = useRef(answers)
    const statusesRef = useRef(statuses)

    answersRef.current  = answers
    statusesRef.current = statuses

    const blankLines = song.lines.filter(l => l.blank).length

    // ── Cargar YouTube IFrame API ─────────────────────────────────────────────
    useEffect(() => {
        function initPlayer() {
            playerRef.current = new window.YT.Player(`yt-${song.youtube_video_id}`, {
                videoId: song.youtube_video_id,
                host: 'https://www.youtube-nocookie.com',
                playerVars: {
                    controls: 0, disablekb: 1, modestbranding: 1, rel: 0,
                    origin: window.location.origin,
                    cc_load_policy: 0,      // no cargar subtítulos
                    iv_load_policy: 3,      // no mostrar anotaciones
                    fs: 0,                  // sin fullscreen
                },
                events: {
                    onReady:       () => setState('ready'),
                    onStateChange: (e: any) => { if (e.data === 0) finishGame() },
                },
            })
        }

        if (window.YT && window.YT.Player) initPlayer()
        else {
            const tag = document.createElement('script')
            tag.src = 'https://www.youtube.com/iframe_api'
            document.body.appendChild(tag)
            window.onYouTubeIframeAPIReady = initPlayer
        }

        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [song.youtube_video_id])

    // ── Game loop ──────────────────────────────────────────────────────────────
    const startLoop = useCallback(() => {
        if (pollRef.current) clearInterval(pollRef.current)

        pollRef.current = window.setInterval(() => {
            const player = playerRef.current
            if (!player || typeof player.getCurrentTime !== 'function') return

            const t = player.getCurrentTime()

            const idx = song.lines.findIndex((l, i) => {
                const next = song.lines[i + 1]
                return t >= l.time && (!next || t < next.time)
            })
            if (idx !== -1 && idx !== activeLine) setActiveLine(idx)

            for (let i = 0; i < song.lines.length; i++) {
                const line = song.lines[i]
                if (!line.blank) continue
                if (statusesRef.current[i] === 'correct' || statusesRef.current[i] === 'missed') continue

                if (t >= line.blank.deadline + graceSecs) {
                    const given = normalize(answersRef.current[i] ?? '')
                    if (given === normalize(line.blank.word)) {
                        setStatuses(s => ({ ...s, [i]: 'correct' }))
                    } else {
                        player.pauseVideo()
                        setMissedLine(i)
                        setState('paused_miss')
                        if (pollRef.current) clearInterval(pollRef.current)
                    }
                    break
                }
            }
        }, 100)
    }, [song.lines, activeLine, graceSecs])

    // ── Scroll automático ──────────────────────────────────────────────────────
    useEffect(() => {
        if (scrollRef.current) {
            const offset = Math.max(0, activeLine * 45 - 110)
            scrollRef.current.style.transform = `translateY(-${offset}px)`
        }
    }, [activeLine])

    // ── Seleccionar opción ─────────────────────────────────────────────────────
    function selectOption(lineIdx: number, option: string) {
        if (statusesRef.current[lineIdx] === 'correct') return
        setAnswers(a => ({ ...a, [lineIdx]: option }))

        const line = song.lines[lineIdx]
        if (line.blank && normalize(option) === normalize(line.blank.word)) {
            setStatuses(s => ({ ...s, [lineIdx]: 'correct' }))
        }
    }

    // ── Controles ──────────────────────────────────────────────────────────────
    function startGame() {
        setState('playing')
        playerRef.current?.playVideo()
        startLoop()
    }

    function smartRewind() {
        if (missedLine === null) return
        const line = song.lines[missedLine]
        const target = Math.max(0, line.time - rewindSecs)

        setStatuses(s => { const n = { ...s }; delete n[missedLine]; return n })
        setAnswers(a => { const n = { ...a }; delete n[missedLine]; return n })
        setMissedLine(null)
        setState('playing')

        playerRef.current?.seekTo(target, true)
        playerRef.current?.playVideo()
        startLoop()
    }

    function skipBlank() {
        if (missedLine !== null) setStatuses(s => ({ ...s, [missedLine]: 'missed' }))
        setMissedLine(null)
        setState('playing')
        playerRef.current?.playVideo()
        startLoop()
    }

    function finishGame() {
        if (pollRef.current) clearInterval(pollRef.current)
        const correct = Object.values(statusesRef.current).filter(s => s === 'correct').length
        const score   = blankLines > 0 ? Math.round((correct / blankLines) * 100) : 0
        setState('completed')
        onComplete?.({ correct, total: blankLines, score })
    }

    // ── Blank objetivo actual (el más próximo sin resolver) ───────────────────
    const targetLine = song.lines.findIndex((l, i) =>
        l.blank && statuses[i] !== 'correct' && statuses[i] !== 'missed'
    )
    // Mostrar opciones solo cuando estamos cerca de ese blank
    const showChoices = targetLine !== -1 && activeLine >= targetLine - 1

    const correctCount = Object.values(statuses).filter(s => s === 'correct').length

    // ── Render de una línea con su slot ───────────────────────────────────────
    function renderLine(line: LyricLine, i: number): React.ReactNode {
        if (!line.blank) return line.text

        const status = statuses[i] ?? 'pending'
        const slotText = status === 'correct' || status === 'missed'
            ? line.blank.word
            : (answers[i] ?? '_____')

        const slotClass = `la-slot ${
            status === 'correct' ? 'correct' :
            status === 'missed'  ? 'missed'  :
            answers[i]           ? 'filled'  : ''
        }`

        const words = line.text.split(' ')
        const bIdx  = words.findIndex(w => normalize(w) === normalize(line.blank!.word))

        if (bIdx === -1) {
            return <>{line.text} <span className={slotClass}>{slotText}</span></>
        }
        return (
            <>
                {words.slice(0, bIdx).join(' ')}{bIdx > 0 ? ' ' : ''}
                <span className={slotClass}>{slotText}</span>
                {' '}{words.slice(bIdx + 1).join(' ')}
            </>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="la-root">

            <div className="la-header">
                <div className="la-song-title">{song.title}</div>
                <div className="la-song-artist">{song.artist}</div>
            </div>

            <div className="la-player-wrap">
                <div id={`yt-${song.youtube_video_id}`} />
            </div>

            {(state === 'playing' || state === 'paused_miss') && (
                <div className="la-stats">
                    <div className="la-stat">
                        <div className="la-stat-num">{correctCount}/{blankLines}</div>
                        <div className="la-stat-label">Correct</div>
                    </div>
                    <div className="la-stat">
                        <div className="la-stat-num">{activeLine + 1}/{song.lines.length}</div>
                        <div className="la-stat-label">Line</div>
                    </div>
                </div>
            )}

            {state === 'loading' && (
                <div className="la-start"><div className="la-start-icon">🎧</div><div className="la-start-title">Loading...</div></div>
            )}

            {state === 'ready' && (
                <div className="la-start">
                    <div className="la-start-icon">🎧</div>
                    <div className="la-start-title">Listen & Choose</div>
                    <p className="la-start-desc">
                        The song will play with the lyrics. When a word is missing, pick the one you
                        hear from the options. The choices sound alike — listen carefully! Miss one and
                        the song pauses so you can rewind.
                    </p>
                    <button className="la-btn la-btn-primary" onClick={startGame}>▶ Start</button>
                </div>
            )}

            {state === 'paused_miss' && (
                <div className="la-paused-banner">
                    <div className="la-paused-text">
                        ⏸ <strong>Missed that one!</strong> Rewind to listen again, or skip and keep going.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="la-btn la-btn-rewind" onClick={smartRewind}>↺ Rewind {rewindSecs}s</button>
                        <button className="la-btn la-btn-secondary" onClick={skipBlank}>Skip →</button>
                    </div>
                </div>
            )}

            {(state === 'playing' || state === 'paused_miss') && (
                <>
                    <div className="la-lyrics">
                        <div ref={scrollRef} className="la-lyrics-scroll">
                            {song.lines.map((line, i) => (
                                <div key={i} className={`la-line ${i === activeLine ? 'active' : ''} ${i < activeLine ? 'past' : ''}`}>
                                    {renderLine(line, i)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Choices bar — opción múltiple del blank objetivo */}
                    {showChoices && song.lines[targetLine].blank && (
                        <div className="la-choices">
                            <div className="la-choices-q">Which word do you hear?</div>
                            <div className="la-choices-row">
                                {song.lines[targetLine].blank!.options.map((opt, k) => {
                                    const isSel  = answers[targetLine] === opt
                                    const isCorr = normalize(opt) === normalize(song.lines[targetLine].blank!.word)
                                    const cls = isSel ? (isCorr ? 'correct' : 'wrong') : ''
                                    return (
                                        <button
                                            key={k}
                                            className={`la-choice ${cls}`}
                                            onClick={() => selectOption(targetLine, opt)}
                                            disabled={statuses[targetLine] === 'correct'}
                                        >
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {state === 'completed' && (
                <div className="la-complete">
                    <div className="la-complete-score">{blankLines > 0 ? Math.round((correctCount / blankLines) * 100) : 0}</div>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: '#2E7D32' }}>
                        You got {correctCount} of {blankLines} words!
                    </div>
                    <p style={{ fontSize: 13, color: '#5D7A52' }}>
                        Great listening practice. The more you do this, the sharper your ear gets.
                    </p>
                </div>
            )}

        </div>
    )
}