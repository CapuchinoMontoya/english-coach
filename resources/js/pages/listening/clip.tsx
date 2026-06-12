import { useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import { Check, ChevronRight, Clapperboard, RotateCcw, X } from 'lucide-react'

interface ClipQuestion {
    question:    string
    options:     string[]
    correct:     number
    explanation: string
}

interface ClipProps {
    activityId: number
    clip: {
        title:            string
        show:             string
        youtube_video_id: string
        duration:         number | null
        questions:        ClipQuestion[]
    }
    level:  string
    source: 'lesson' | 'free'
}

type Phase = 'watch' | 'quiz' | 'results'

const csrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''

const card: React.CSSProperties = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--line)',
    borderRadius: 14,
}

export default function ClipActivity({ activityId, clip, level, source }: ClipProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Listening', href: '/listening' },
        { title: clip.title,  href: '#'          },
    ]

    const [phase,    setPhase   ] = useState<Phase>('watch')
    const [current,  setCurrent ] = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [revealed, setRevealed] = useState(false)
    const [answers,  setAnswers ] = useState<number[]>([])

    const questions = clip.questions
    const question  = questions[current]
    const correctCount = answers.filter((a, i) => a === questions[i].correct).length
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

    function confirmAnswer() {
        if (selected === null) return
        setRevealed(true)
        setAnswers(prev => [...prev, selected])
    }

    function nextQuestion() {
        setSelected(null)
        setRevealed(false)
        if (current + 1 < questions.length) {
            setCurrent(current + 1)
        } else {
            setPhase('results')
            saveResult()
        }
    }

    async function saveResult() {
        // answers ya incluye la última respuesta (confirmAnswer corre antes)
        const finalCorrect = answers.filter((a, i) => a === questions[i].correct).length
        try {
            await fetch('/listening/complete', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
                body:    JSON.stringify({
                    activity_id: activityId,
                    correct:     finalCorrect,
                    total:       questions.length,
                    score:       Math.round((finalCorrect / questions.length) * 100),
                    source:      source,
                }),
            })
        } catch {
            // silencioso
        }
    }

    function restart() {
        setPhase('watch')
        setCurrent(0)
        setSelected(null)
        setRevealed(false)
        setAnswers([])
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Clip: ${clip.title}`} />

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 48px' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 10, background: 'var(--accent-soft)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Clapperboard size={20} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h1 style={{
                            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                            fontSize: 24, color: 'var(--primary)', lineHeight: 1.15, margin: 0,
                        }}>
                            {clip.title}
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '2px 0 0' }}>
                            {clip.show} · Level {level}
                        </p>
                    </div>
                    {phase === 'quiz' && (
                        <span style={{
                            fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)',
                            padding: '4px 12px', borderRadius: 999,
                            background: 'var(--bg-sunken)', border: '1px solid var(--line)',
                            whiteSpace: 'nowrap',
                        }}>
                            {current + 1} / {questions.length}
                        </span>
                    )}
                </div>

                {/* ── Phase: watch ── */}
                {phase === 'watch' && (
                    <>
                        <div style={{
                            ...card, overflow: 'hidden', marginBottom: 16,
                            aspectRatio: '16 / 9', position: 'relative',
                        }}>
                            <iframe
                                src={`https://www.youtube.com/embed/${clip.youtube_video_id}?rel=0&modestbranding=1`}
                                title={clip.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                            />
                        </div>

                        <div style={{ ...card, padding: '16px 20px', marginBottom: 16 }}>
                            <p style={{ fontSize: 14, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>
                                🎬 Watch the scene carefully — you can replay it as many times as you
                                need. When you're ready, answer {questions.length} comprehension
                                questions about what was said.
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setPhase('quiz')} style={primaryBtn}>
                                I'm ready — start questions
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </>
                )}

                {/* ── Phase: quiz ── */}
                {phase === 'quiz' && question && (
                    <>
                        {/* Progress bar */}
                        <div style={{
                            height: 5, borderRadius: 999, background: 'var(--bg-sunken)',
                            marginBottom: 20, overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', borderRadius: 999, background: 'var(--accent)',
                                width: `${((current + (revealed ? 1 : 0)) / questions.length) * 100}%`,
                                transition: 'width .25s ease',
                            }} />
                        </div>

                        <div style={{ ...card, padding: '22px 24px', marginBottom: 16 }}>
                            <p style={{
                                fontSize: 16, fontWeight: 500, color: 'var(--ink)',
                                margin: '0 0 16px', lineHeight: 1.5,
                            }}>
                                {question.question}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {question.options.map((opt, idx) => {
                                    const isSelected = selected === idx
                                    const isCorrect  = idx === question.correct

                                    let border = 'var(--line)'
                                    let bg     = 'var(--bg-elevated)'
                                    if (revealed && isCorrect)               { border = 'var(--success)'; bg = 'var(--success-soft)' }
                                    else if (revealed && isSelected)         { border = 'var(--danger)';  bg = 'var(--danger-soft)'  }
                                    else if (!revealed && isSelected)        { border = 'var(--accent)';  bg = 'var(--accent-soft)'  }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !revealed && setSelected(idx)}
                                            disabled={revealed}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '12px 14px', textAlign: 'left',
                                                border: `1.5px solid ${border}`, borderRadius: 10,
                                                background: bg, color: 'var(--ink)', fontSize: 14,
                                                cursor: revealed ? 'default' : 'pointer',
                                                fontFamily: 'DM Sans, sans-serif',
                                                transition: 'all .12s',
                                            }}
                                        >
                                            <span style={{
                                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                                border: `2px solid ${border}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 11, fontWeight: 600,
                                                background: revealed && isCorrect ? 'var(--success)'
                                                    : revealed && isSelected ? 'var(--danger)' : 'transparent',
                                                color: revealed && (isCorrect || isSelected) ? '#fff' : 'var(--ink-muted)',
                                            }}>
                                                {revealed && isCorrect
                                                    ? <Check size={12} />
                                                    : revealed && isSelected
                                                        ? <X size={12} />
                                                        : String.fromCharCode(65 + idx)}
                                            </span>
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Explanation after revealing */}
                            {revealed && question.explanation && (
                                <div style={{
                                    marginTop: 14, padding: '12px 14px', borderRadius: 10,
                                    background: 'var(--info-soft)', fontSize: 13,
                                    color: 'var(--ink-muted)', lineHeight: 1.55,
                                }}>
                                    💡 {question.explanation}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            {!revealed ? (
                                <button
                                    onClick={confirmAnswer}
                                    disabled={selected === null}
                                    style={{ ...primaryBtn, opacity: selected === null ? .4 : 1 }}
                                >
                                    Check answer
                                </button>
                            ) : (
                                <button onClick={nextQuestion} style={primaryBtn}>
                                    {current + 1 < questions.length ? 'Next question' : 'See results'}
                                    <ChevronRight size={15} />
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* ── Phase: results ── */}
                {phase === 'results' && (
                    <>
                        <div style={{ ...card, padding: '34px 24px', textAlign: 'center', marginBottom: 16 }}>
                            <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 8 }}>
                                {score >= 80 ? '🏆' : score >= 60 ? '👏' : '💪'}
                            </div>
                            <div style={{
                                fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 500,
                                lineHeight: 1, marginBottom: 4,
                                color: score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--accent)' : 'var(--danger)',
                            }}>
                                {score}
                            </div>
                            <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}>
                                {correctCount} of {questions.length} correct
                            </p>
                        </div>

                        {/* Review */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                            {questions.map((q, i) => {
                                const ok = answers[i] === q.correct
                                return (
                                    <div key={i} style={{
                                        ...card, padding: '12px 16px', display: 'flex', gap: 10,
                                        borderColor: ok ? 'var(--success)' : 'var(--danger)',
                                        alignItems: 'flex-start',
                                    }}>
                                        <span style={{
                                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                                            background: ok ? 'var(--success-soft)' : 'var(--danger-soft)',
                                            color: ok ? 'var(--success)' : 'var(--danger)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {ok ? <Check size={11} /> : <X size={11} />}
                                        </span>
                                        <div style={{ fontSize: 13 }}>
                                            <div style={{ color: 'var(--ink)', fontWeight: 500, marginBottom: 2 }}>
                                                {q.question}
                                            </div>
                                            <div style={{ color: 'var(--ink-muted)' }}>
                                                {ok
                                                    ? q.options[q.correct]
                                                    : <>You said: <span style={{ color: 'var(--danger)' }}>{q.options[answers[i]]}</span> — correct: <span style={{ color: 'var(--success)' }}>{q.options[q.correct]}</span></>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                            <button onClick={restart} style={secondaryBtn}>
                                <RotateCcw size={14} />
                                Watch again
                            </button>
                            <button
                                onClick={() => router.visit(source === 'lesson' ? '/lessons' : '/listening')}
                                style={primaryBtn}
                            >
                                {source === 'lesson' ? 'Back to lessons' : 'Back to library'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    )
}

const primaryBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '11px 22px', borderRadius: 10, border: 'none',
    background: 'var(--primary)', color: 'var(--on-primary)',
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
}

const secondaryBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '11px 20px', borderRadius: 10,
    border: '1px solid var(--line)', background: 'transparent',
    color: 'var(--primary)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
}
