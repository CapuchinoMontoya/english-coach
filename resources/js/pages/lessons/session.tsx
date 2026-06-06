import React, { useEffect, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import '../lessons.css'
import './session.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type ExerciseType = 'fill_blank' | 'multiple_choice' | 'error_correction' | 'word_order' | 'translation_es_to_en'

interface Exercise {
    id:          string
    type:        ExerciseType
    instruction: string
    question:    string | string[]
    options?:    string[]
    answer:      string | number
}

interface GeneratedSession {
    aspect:                 string
    grammar_points_covered: string[]
    is_consolidation:       boolean
    warmup?: {
        intro:     string
        exercises: Exercise[]
    }
    mini_lesson: {
        title: string
        html:  string
    }
    practice: {
        intro:     string
        exercises: Exercise[]
    }
    free_production: {
        prompt:            string
        target_structures: string[]
        min_words:         number
    }
}

interface SessionState {
    session_number:    number
    is_first_session:  boolean
    aspects_covered:   string[]
    aspects_remaining: string[]
    cumulative_score:  number
    sessions_done:     number
    min_sessions_met:  boolean
}

interface ExerciseResult {
    id:             string
    correct:        boolean
    student_answer: string | number
    correct_answer: string | number
    feedback:       string
}

interface Evaluation {
    session_score:            number
    errors_this_session:      string[]
    warmup_performance:       string
    exercise_results:         ExerciseResult[]
    free_production_feedback: string
    encouragement:            string
}

interface SessionResult {
    mastered:          boolean
    session_score:     number
    cumulative_score:  number
    sessions_count:    number
    aspects_remaining: string[]
    next_step:         'topic_completed' | 'needs_consolidation' | 'next_session'
}

interface SessionPageProps {
    topic: {
        id:          number
        order:       number
        title:       string
        description: string
    }
    sessionState: SessionState
}

type Phase = 'loading' | 'warmup' | 'lesson' | 'practice' | 'production' | 'evaluating' | 'results'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const csrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''

async function postJson(url: string, body: object) {
    const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
        body:    JSON.stringify(body),
    })
    return res.json()
}

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length
}

// Resuelve la respuesta del estudiante a string (word_order usa índices)
function resolveStudentAnswer(ex: Exercise, raw: string | number | number[] | undefined): string | number {
    if (raw === undefined || raw === null) return ''
    if (ex.type === 'word_order' && Array.isArray(raw)) {
        const words = ex.question as string[]
        return raw.map(i => words[i]).join(' ')
    }
    return raw as string | number
}

// ─── Exercise renderer ────────────────────────────────────────────────────────

function ExerciseInput({
    exercise, answer, onChange,
}: {
    exercise: Exercise
    answer:   string | number | number[] | undefined
    onChange: (v: string | number | number[]) => void
}) {
    switch (exercise.type) {
        case 'fill_blank':
            return (
                <input
                    className="fill-input"
                    type="text"
                    value={(answer as string) ?? ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder="Type your answer..."
                />
            )

        case 'multiple_choice':
            return (
                <div className="mc-options">
                    {(exercise.options ?? []).map((opt, idx) => (
                        <div
                            key={idx}
                            className={`mc-option ${answer === idx ? 'selected' : ''}`}
                            onClick={() => onChange(idx)}
                            role="radio"
                            aria-checked={answer === idx}
                            tabIndex={0}
                            onKeyDown={e => e.key === ' ' && onChange(idx)}
                        >
                            <div className="mc-radio" />
                            {opt}
                        </div>
                    ))}
                </div>
            )

        case 'error_correction':
        case 'translation_es_to_en':
            return (
                <textarea
                    className="correction-input"
                    value={(answer as string) ?? ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={exercise.type === 'translation_es_to_en'
                        ? 'Write your translation in English...'
                        : 'Write the corrected sentence...'}
                />
            )

        case 'word_order': {
            const words    = exercise.question as string[]
            const selected = (answer as number[]) ?? []
            const usedSet  = new Set(selected)

            return (
                <>
                    <div className={`word-builder ${selected.length > 0 ? 'has-words' : ''}`}>
                        {selected.length === 0
                            ? <span className="word-builder-placeholder">Click words below to build your sentence...</span>
                            : selected.map((wordIdx, pos) => (
                                <span
                                    key={pos}
                                    className="word-chip in-sentence"
                                    onClick={() => {
                                        const next = [...selected]
                                        next.splice(pos, 1)
                                        onChange(next)
                                    }}
                                >
                                    {words[wordIdx]}
                                </span>
                            ))
                        }
                        {selected.length > 0 && (
                            <button className="word-clear-btn" onClick={() => onChange([])}>✕ clear</button>
                        )}
                    </div>
                    <div className="word-pool">
                        {words.map((word, idx) => (
                            !usedSet.has(idx) && (
                                <span
                                    key={idx}
                                    className="word-chip in-pool"
                                    onClick={() => onChange([...selected, idx])}
                                >
                                    {word}
                                </span>
                            )
                        ))}
                    </div>
                </>
            )
        }

        default:
            return null
    }
}

function ExerciseCard({
    exercise, index, total, answer, onChange,
}: {
    exercise: Exercise
    index:    number
    total:    number
    answer:   string | number | number[] | undefined
    onChange: (v: string | number | number[]) => void
}) {
    const isAnswered = answer !== undefined && answer !== null &&
        (typeof answer === 'string' ? answer.trim() !== '' :
         Array.isArray(answer) ? answer.length > 0 : true)

    const questionText = exercise.type === 'word_order'
        ? `Arrange these words: ${(exercise.question as string[]).join(' / ')}`
        : exercise.question as string

    return (
        <div className={`exercise-card ${isAnswered ? 'answered' : ''}`}>
            <div className="exercise-num">Exercise {index + 1} / {total}</div>
            <div className="exercise-instruction">{exercise.instruction}</div>
            <div className="exercise-question">{questionText}</div>
            <ExerciseInput exercise={exercise} answer={answer} onChange={onChange} />
        </div>
    )
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function Loading({ message }: { message: string }) {
    return (
        <div className="lesson-loading">
            <div className="lesson-loading-dots"><span /><span /><span /></div>
            <p className="lesson-loading-msg">{message}</p>
        </div>
    )
}

// ─── Phase bar ────────────────────────────────────────────────────────────────

function PhaseBar({ phase, hasWarmup }: { phase: Phase; hasWarmup: boolean }) {
    const steps: { id: Phase; label: string }[] = [
        ...(hasWarmup ? [{ id: 'warmup' as Phase, label: 'Warm-up' }] : []),
        { id: 'lesson',     label: 'Lesson'     },
        { id: 'practice',   label: 'Practice'   },
        { id: 'production',  label: 'Writing'   },
        { id: 'results',    label: 'Results'    },
    ]
    const order = steps.map(s => s.id)
    const currentIdx = order.indexOf(phase === 'evaluating' ? 'production' : phase)

    return (
        <div className="phase-bar">
            {steps.map((s, i) => {
                const done   = i < currentIdx
                const active = i === currentIdx
                return (
                    <React.Fragment key={s.id}>
                        {i > 0 && <div className={`phase-line ${done ? 'done' : ''}`} />}
                        <div className={`phase-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                            <div className="phase-dot">{done ? '✓' : i + 1}</div>
                            <span>{s.label}</span>
                        </div>
                    </React.Fragment>
                )
            })}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SessionPage({ topic, sessionState }: SessionPageProps) {
    const [phase,      setPhase]      = useState<Phase>('loading')
    const [loadingMsg, setLoadingMsg] = useState('Alex is preparing your session...')
    const [session,    setSession]    = useState<GeneratedSession | null>(null)
    const [sessionId,  setSessionId]  = useState<number | null>(null)

    const [warmupAnswers,   setWarmupAnswers]   = useState<Record<string, string | number | number[]>>({})
    const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string | number | number[]>>({})
    const [productionText,  setProductionText]  = useState('')

    const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
    const [result,     setResult]     = useState<SessionResult | null>(null)

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Lessons',   href: '/lessons'   },
        { title: topic.title, href: '#'          },
    ]

    // ── Generate session on mount ────────────────────────────────────────────
    useEffect(() => { generate() }, [])

    async function generate() {
        setPhase('loading')
        setLoadingMsg('Alex is preparing your session...')
        try {
            const data = await postJson((window as any).route('lessons.session.generate'), {
                topic_id: topic.id,
            })
            if (data.error || !data.session) {
                setLoadingMsg('Something went wrong generating the session. Please refresh.')
                return
            }
            setSession(data.session)
            setSessionId(data.session_id)
            // Primera fase: warmup si existe, si no lesson
            setPhase(data.session.warmup ? 'warmup' : 'lesson')
        } catch {
            setLoadingMsg('Connection error. Please refresh.')
        }
    }

    // ── Submit ───────────────────────────────────────────────────────────────
    async function submit() {
        if (!session || !sessionId) return
        setPhase('evaluating')
        setLoadingMsg('Alex is checking your work...')

        const warmupSub = (session.warmup?.exercises ?? []).map(ex => ({
            id: ex.id, type: ex.type, question: ex.question, answer: ex.answer,
            student_answer: resolveStudentAnswer(ex, warmupAnswers[ex.id]),
        }))

        const practiceSub = session.practice.exercises.map(ex => ({
            id: ex.id, type: ex.type, question: ex.question, answer: ex.answer,
            student_answer: resolveStudentAnswer(ex, practiceAnswers[ex.id]),
        }))

        const submission = {
            aspect:                 session.aspect,
            grammar_points_covered: session.grammar_points_covered,
            warmup_answers:         warmupSub,
            practice_answers:       practiceSub,
            free_production: {
                prompt: session.free_production.prompt,
                text:   productionText,
            },
        }

        try {
            const data = await postJson((window as any).route('lessons.session.submit'), {
                topic_id:   topic.id,
                session_id: sessionId,
                submission,
            })
            if (data.error) {
                setLoadingMsg('Evaluation error. Please try submitting again.')
                return
            }
            setEvaluation(data.evaluation)
            setResult(data.result)
            setPhase('results')
        } catch {
            setLoadingMsg('Connection error during evaluation.')
        }
    }

    // ── Validation per phase ─────────────────────────────────────────────────
    const warmupComplete = !session?.warmup ||
        session.warmup.exercises.every(ex => {
            const a = warmupAnswers[ex.id]
            return a !== undefined && (typeof a === 'string' ? a.trim() !== '' : Array.isArray(a) ? a.length > 0 : true)
        })

    const practiceComplete = session?.practice.exercises.every(ex => {
        const a = practiceAnswers[ex.id]
        return a !== undefined && (typeof a === 'string' ? a.trim() !== '' : Array.isArray(a) ? a.length > 0 : true)
    }) ?? false

    const wordCount    = countWords(productionText)
    const productionOk = session ? wordCount >= session.free_production.min_words : false

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Session: ${topic.title}`} />

            <div className="lesson-root">

                {session && phase !== 'loading' && (
                    <PhaseBar phase={phase} hasWarmup={!!session.warmup} />
                )}

                {/* Topic + session meta */}
                <div className="lesson-topic-header">
                    <div className="lesson-topic-label">
                        Topic {topic.order} · Session {sessionState.session_number}
                    </div>
                    <div className="lesson-topic-title">{topic.title}</div>
                </div>

                {session && phase !== 'loading' && phase !== 'results' && (
                    <div className="session-meta">
                        <span className="session-meta-item">
                            Today's focus: <strong>{session.aspect}</strong>
                        </span>
                        {sessionState.cumulative_score > 0 && (
                            <span className="session-meta-item">
                                Progress so far: <strong>{sessionState.cumulative_score}/100</strong>
                            </span>
                        )}
                        {session.is_consolidation && (
                            <span className="session-meta-item">
                                <strong>🎯 Consolidation session</strong>
                            </span>
                        )}
                    </div>
                )}

                {/* ── LOADING / EVALUATING ── */}
                {(phase === 'loading' || phase === 'evaluating') && <Loading message={loadingMsg} />}

                {/* ── WARM-UP ── */}
                {phase === 'warmup' && session?.warmup && (
                    <>
                        <div className="warmup-banner">
                            🔁 Quick review of what you learned last time
                        </div>
                        <p className="phase-intro">{session.warmup.intro}</p>

                        <div className="exercises-list">
                            {session.warmup.exercises.map((ex, i) => (
                                <ExerciseCard
                                    key={ex.id}
                                    exercise={ex}
                                    index={i}
                                    total={session.warmup!.exercises.length}
                                    answer={warmupAnswers[ex.id]}
                                    onChange={v => setWarmupAnswers(p => ({ ...p, [ex.id]: v }))}
                                />
                            ))}
                        </div>

                        <div className="lesson-actions">
                            <button
                                className="btn-lesson-primary"
                                disabled={!warmupComplete}
                                onClick={() => setPhase('lesson')}
                            >
                                Continue to lesson →
                            </button>
                        </div>
                    </>
                )}

                {/* ── MINI-LESSON ── */}
                {phase === 'lesson' && session && (
                    <>
                        <div
                            className="theory-content"
                            dangerouslySetInnerHTML={{ __html: session.mini_lesson.html }}
                        />
                        <div className="lesson-actions">
                            <button className="btn-lesson-primary" onClick={() => setPhase('practice')}>
                                I'm ready to practice →
                            </button>
                        </div>
                    </>
                )}

                {/* ── PRACTICE ── */}
                {phase === 'practice' && session && (
                    <>
                        <p className="phase-intro">
                            {session.practice.intro} Answer on your own — no hints. That's how you learn.
                        </p>

                        <div className="exercises-list">
                            {session.practice.exercises.map((ex, i) => (
                                <ExerciseCard
                                    key={ex.id}
                                    exercise={ex}
                                    index={i}
                                    total={session.practice.exercises.length}
                                    answer={practiceAnswers[ex.id]}
                                    onChange={v => setPracticeAnswers(p => ({ ...p, [ex.id]: v }))}
                                />
                            ))}
                        </div>

                        <div className="lesson-actions">
                            <button
                                className="btn-lesson-primary"
                                disabled={!practiceComplete}
                                onClick={() => setPhase('production')}
                            >
                                Continue to writing →
                            </button>
                        </div>
                    </>
                )}

                {/* ── FREE PRODUCTION ── */}
                {phase === 'production' && session && (
                    <>
                        <div className="production-prompt-box">
                            <div className="production-prompt-label">Your writing task</div>
                            <p className="production-prompt-text">{session.free_production.prompt}</p>
                            {session.free_production.target_structures.length > 0 && (
                                <div className="production-targets">
                                    {session.free_production.target_structures.map((t, i) => (
                                        <span key={i} className="production-target-chip">{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <textarea
                            className="production-textarea"
                            value={productionText}
                            onChange={e => setProductionText(e.target.value)}
                            placeholder="Write your answer here in English..."
                        />
                        <div className={`word-count ${productionOk ? 'met' : ''}`}>
                            {wordCount} / {session.free_production.min_words} words minimum
                        </div>

                        <div className="lesson-actions">
                            <button
                                className="btn-lesson-secondary"
                                onClick={() => setPhase('practice')}
                            >
                                ← Back
                            </button>
                            <button
                                className="btn-lesson-primary"
                                disabled={!productionOk}
                                onClick={submit}
                            >
                                Submit session
                            </button>
                        </div>
                    </>
                )}

                {/* ── RESULTS ── */}
                {phase === 'results' && evaluation && result && (
                    <>
                        {/* Mastery banner */}
                        <div className={`mastery-banner ${
                            result.next_step === 'topic_completed'    ? 'completed' :
                            result.next_step === 'needs_consolidation' ? 'consolidation' : 'next'
                        }`}>
                            <div className="mastery-emoji">
                                {result.next_step === 'topic_completed'    ? '🎉' :
                                 result.next_step === 'needs_consolidation' ? '💪' : '📈'}
                            </div>
                            <div className="mastery-title">
                                {result.next_step === 'topic_completed'    ? 'Topic mastered!' :
                                 result.next_step === 'needs_consolidation' ? 'Almost there!' : 'Great progress!'}
                            </div>
                            <p className="mastery-msg">
                                {result.next_step === 'topic_completed'
                                    ? 'You\'ve shown consistent mastery across multiple sessions. The next topic is now unlocked.'
                                    : result.next_step === 'needs_consolidation'
                                        ? 'You\'ve covered all the material — one more solid session will lock it in.'
                                        : `${evaluation.encouragement} Come back for your next session to keep building.`}
                            </p>

                            <div className="score-chips">
                                <div className="score-chip">
                                    <div className="score-chip-num">{result.session_score}</div>
                                    <div className="score-chip-label">This session</div>
                                </div>
                                <div className="score-chip">
                                    <div className="score-chip-num">{result.cumulative_score}</div>
                                    <div className="score-chip-label">Topic average</div>
                                </div>
                                <div className="score-chip">
                                    <div className="score-chip-num">{result.sessions_count}</div>
                                    <div className="score-chip-label">Sessions done</div>
                                </div>
                            </div>
                        </div>

                        {/* Free production feedback */}
                        {evaluation.free_production_feedback && (
                            <div className="production-fb-box">
                                <div className="production-fb-label">Feedback on your writing</div>
                                <p className="production-fb-text">{evaluation.free_production_feedback}</p>
                            </div>
                        )}

                        {/* Per-exercise breakdown */}
                        {evaluation.exercise_results.length > 0 && (
                            <div className="results-exercises">
                                {evaluation.exercise_results.map((res) => (
                                    <div
                                        key={res.id}
                                        className={`result-exercise-card ${res.correct ? 'correct' : 'incorrect'}`}
                                    >
                                        <div className={`result-icon ${res.correct ? 'correct' : 'incorrect'}`}>
                                            {res.correct ? '✓' : '✗'}
                                        </div>
                                        <div className="result-body">
                                            {!res.correct && (
                                                <div className="result-answers">
                                                    <span className="yours">You: {String(res.student_answer)}</span>
                                                    {' · '}
                                                    <span className="correct-ans">Correct: {String(res.correct_answer)}</span>
                                                </div>
                                            )}
                                            <div className="result-fb">{res.feedback}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="lesson-actions">
                            <button
                                className="btn-lesson-secondary"
                                onClick={() => router.visit((window as any).route('lessons.index'))}
                            >
                                Back to lessons
                            </button>
                            {!result.mastered && (
                                <button
                                    className="btn-lesson-primary"
                                    onClick={generate}
                                >
                                    Start next session →
                                </button>
                            )}
                            {result.mastered && (
                                <button
                                    className="btn-lesson-primary"
                                    onClick={() => router.visit((window as any).route('lessons.index'))}
                                >
                                    Continue to next topic →
                                </button>
                            )}
                        </div>
                    </>
                )}

            </div>
        </AppLayout>
    )
}