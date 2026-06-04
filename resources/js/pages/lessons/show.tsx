import React, { useCallback, useEffect, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import '../lessons.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'theory' | 'practice' | 'results'
type ExerciseType = 'fill_blank' | 'multiple_choice' | 'error_correction' | 'word_order' | 'translation_es_to_en'

interface Topic {
    id:                  number
    order:               number
    title:               string
    description:         string
    grammar_points:      string[]
    estimated_sessions:  number
}

interface Progress {
    status:        string
    sessions_done: number
    attempts:      number
}

interface Exercise {
    id:          number
    type:        ExerciseType
    instruction: string
    question:    string | string[]
    options?:    string[]        // multiple_choice
    answer:      string | number
    hint:        string | null
}

interface ExerciseResult {
    id:             number
    correct:        boolean
    student_answer: string | number
    correct_answer: string | number
    feedback:       string
}

interface EvaluationResult {
    overall_score:    number
    passed:           boolean
    feedback_summary: string
    exercises:        ExerciseResult[]
}

interface LessonShowProps {
    topic:    Topic
    progress: Progress
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const csrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''

async function postJson(url: string, body: object) {
    const res = await fetch(url, {
        method:  'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrf(),
        },
        body: JSON.stringify(body),
    })
    return res.json()
}

// ─── Exercise sub-components ──────────────────────────────────────────────────

function FillBlankExercise({
    exercise, answer, onChange,
}: {
    exercise: Exercise
    answer:   string
    onChange: (v: string) => void
}) {
    return (
        <input
            className="fill-input"
            type="text"
            value={answer}
            onChange={e => onChange(e.target.value)}
            placeholder="Type your answer..."
        />
    )
}

function MultipleChoiceExercise({
    exercise, answer, onChange,
}: {
    exercise: Exercise
    answer:   number | null
    onChange: (v: number) => void
}) {
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
}

function ErrorCorrectionExercise({
    answer, onChange,
}: {
    answer:   string
    onChange: (v: string) => void
}) {
    return (
        <textarea
            className="correction-input"
            value={answer}
            onChange={e => onChange(e.target.value)}
            placeholder="Write the corrected sentence..."
        />
    )
}

function WordOrderExercise({
    words, sentenceIndices, onChange,
}: {
    words:           string[]
    sentenceIndices: number[]
    onChange:        (indices: number[]) => void
}) {
    function addWord(idx: number) {
        onChange([...sentenceIndices, idx])
    }

    function removeWord(pos: number) {
        const next = [...sentenceIndices]
        next.splice(pos, 1)
        onChange(next)
    }

    function clear() { onChange([]) }

    const usedSet = new Set(sentenceIndices)

    return (
        <>
            {/* Sentence builder */}
            <div className={`word-builder ${sentenceIndices.length > 0 ? 'has-words' : ''}`}>
                {sentenceIndices.length === 0
                    ? <span className="word-builder-placeholder">Click words below to build your sentence...</span>
                    : sentenceIndices.map((wordIdx, pos) => (
                        <span
                            key={pos}
                            className="word-chip in-sentence"
                            onClick={() => removeWord(pos)}
                            title="Click to remove"
                        >
                            {words[wordIdx]}
                        </span>
                    ))
                }
                {sentenceIndices.length > 0 && (
                    <button className="word-clear-btn" onClick={clear}>✕ clear</button>
                )}
            </div>

            {/* Word pool */}
            <div className="word-pool">
                {words.map((word, idx) => (
                    !usedSet.has(idx) && (
                        <span
                            key={idx}
                            className="word-chip in-pool"
                            onClick={() => addWord(idx)}
                        >
                            {word}
                        </span>
                    )
                ))}
            </div>
        </>
    )
}

function TranslationExercise({
    exercise, answer, onChange,
}: {
    exercise: Exercise
    answer:   string
    onChange: (v: string) => void
}) {
    return (
        <textarea
            className="correction-input"
            value={answer}
            onChange={e => onChange(e.target.value)}
            placeholder="Write your translation in English..."
        />
    )
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingState({ message }: { message: string }) {
    return (
        <div className="lesson-loading">
            <div className="lesson-loading-dots">
                <span /><span /><span />
            </div>
            <p className="lesson-loading-msg">{message}</p>
        </div>
    )
}

// ─── Phase indicator ──────────────────────────────────────────────────────────

function PhaseBar({ phase }: { phase: Phase }) {
    const phases: { id: Phase; label: string }[] = [
        { id: 'theory',   label: 'Theory'   },
        { id: 'practice', label: 'Practice' },
        { id: 'results',  label: 'Results'  },
    ]
    const currentIdx = phases.findIndex(p => p.id === phase)

    return (
        <div className="phase-bar" aria-label="Lesson progress">
            {phases.map((p, i) => {
                const done   = i < currentIdx
                const active = i === currentIdx
                return (
                    <React.Fragment key={p.id}>
                        {i > 0 && (
                            <div className={`phase-line ${done ? 'done' : ''}`} />
                        )}
                        <div className={`phase-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                            <div className="phase-dot">
                                {done ? '✓' : i + 1}
                            </div>
                            <span>{p.label}</span>
                        </div>
                    </React.Fragment>
                )
            })}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LessonShow({ topic, progress }: LessonShowProps) {
    const [phase,           setPhase]       = useState<Phase>('theory')
    const [loading,         setLoading]     = useState(true)
    const [loadingMsg,      setLoadingMsg]  = useState('Alex is preparing your lesson...')
    const [theoryHtml,      setTheoryHtml]  = useState<string>('')
    const [exercises,       setExercises]   = useState<Exercise[]>([])

    // answers: maps exercise.id → answer value
    const [answers, setAnswers] = useState<Record<number, string | number | number[]>>({})

    const [evaluation,      setEvaluation]  = useState<EvaluationResult | null>(null)
    const [completing,      setCompleting]  = useState(false)

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Lessons',   href: '/lessons'   },
        { title: topic.title, href: '#'          },
    ]

    // ── Load theory on mount ────────────────────────────────────────────────

    useEffect(() => {
        loadTheory()
    }, [])

    async function loadTheory() {
        setLoading(true)
        setLoadingMsg('Alex is preparing your lesson...')
        try {
            const data = await postJson((window as any).route('lessons.theory'), {
                topic_id: topic.id,
            })
            setTheoryHtml(data.html ?? '')
        } catch {
            setTheoryHtml('<p>Error loading lesson. Please refresh.</p>')
        } finally {
            setLoading(false)
        }
    }

    // ── Load exercises ──────────────────────────────────────────────────────

    async function startPractice() {
        setPhase('practice')
        setLoading(true)
        setLoadingMsg('Generating your practice exercises...')
        setAnswers({})
        setEvaluation(null)

        try {
            const data = await postJson((window as any).route('lessons.exercises'), {
                topic_id: topic.id,
            })
            setExercises(data.exercises ?? [])
        } catch {
            setExercises([])
        } finally {
            setLoading(false)
        }
    }

    // ── Answer helpers ──────────────────────────────────────────────────────

    function setAnswer(exerciseId: number, value: string | number | number[]) {
        setAnswers(prev => ({ ...prev, [exerciseId]: value }))
    }

    function isAnswered(ex: Exercise): boolean {
        const ans = answers[ex.id]
        if (ans === undefined || ans === null) return false
        if (typeof ans === 'string')  return ans.trim() !== ''
        if (typeof ans === 'number')  return true
        if (Array.isArray(ans))       return ans.length > 0
        return false
    }

    const allAnswered = exercises.length > 0 && exercises.every(isAnswered)

    // ── Submit answers for evaluation ───────────────────────────────────────

    async function submitAnswers() {
        setLoading(true)
        setLoadingMsg('Checking your answers...')

        // Build submission payload
        const submission = exercises.map(ex => {
            let studentAnswer = answers[ex.id]

            // Word order: convert indices array → string
            if (ex.type === 'word_order' && Array.isArray(studentAnswer)) {
                const words = ex.question as string[]
                studentAnswer = (studentAnswer as number[]).map(i => words[i]).join(' ')
            }

            return {
                id:             ex.id,
                type:           ex.type,
                question:       ex.question,
                answer:         ex.answer,
                student_answer: studentAnswer,
                instruction:    ex.instruction,
            }
        })

        try {
            const result = await postJson((window as any).route('lessons.evaluate'), {
                topic_id:  topic.id,
                exercises: submission,
            })
            setEvaluation(result)
            setPhase('results')
        } catch {
            setEvaluation({
                overall_score:    0,
                passed:           false,
                feedback_summary: 'There was an error evaluating your answers. Please try again.',
                exercises:        [],
            })
            setPhase('results')
        } finally {
            setLoading(false)
        }
    }

    // ── Complete lesson ─────────────────────────────────────────────────────

    async function completeLesson() {
        if (!evaluation) return
        setCompleting(true)

        try {
            const data = await postJson((window as any).route('lessons.complete'), {
                topic_id:         topic.id,
                score:            evaluation.overall_score,
                feedback_summary: evaluation.feedback_summary,
            })

            if (data.passed) {
                router.visit((window as any).route('lessons.index'))
            }
        } catch {
            setCompleting(false)
        }
    }

    // ── Retry (new exercises) ───────────────────────────────────────────────

    async function retry() {
        await startPractice()
    }

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Lesson: ${topic.title}`} />

            <div className="lesson-root">

                {/* Phase bar */}
                <PhaseBar phase={phase} />

                {/* Topic header */}
                <div className="lesson-topic-header">
                    <div className="lesson-topic-label">
                        Topic {topic.order} · {topic.estimated_sessions} sessions
                    </div>
                    <div className="lesson-topic-title">{topic.title}</div>
                    <p style={{ fontSize: 13, color: '#A08070', margin: 0 }}>
                        {topic.description}
                    </p>
                </div>

                {/* ── PHASE: THEORY ─────────────────────────────────────── */}
                {phase === 'theory' && (
                    <>
                        {loading
                            ? <LoadingState message={loadingMsg} />
                            : (
                                <>
                                    <div
                                        className="theory-content"
                                        dangerouslySetInnerHTML={{ __html: theoryHtml }}
                                    />

                                    {/* Grammar points quick reference */}
                                    {topic.grammar_points.length > 0 && (
                                        <div style={{
                                            background: '#F5EFE6',
                                            border: '1px solid #E8DDD4',
                                            borderRadius: 10,
                                            padding: '14px 18px',
                                            marginBottom: 20,
                                        }}>
                                            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: '#A08070', margin: '0 0 8px' }}>
                                                Grammar focus
                                            </p>
                                            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {topic.grammar_points.map((p, i) => (
                                                    <li key={i} style={{ fontSize: 13, color: '#5D3A1A' }}>{p}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="lesson-actions">
                                        <button
                                            className="btn-lesson-primary"
                                            onClick={startPractice}
                                        >
                                            I'm ready to practice →
                                        </button>
                                    </div>
                                </>
                            )
                        }
                    </>
                )}

                {/* ── PHASE: PRACTICE ───────────────────────────────────── */}
                {phase === 'practice' && (
                    <>
                        {loading
                            ? <LoadingState message={loadingMsg} />
                            : (
                                <>
                                    <p style={{ fontSize: 13, color: '#A08070', marginBottom: 16 }}>
                                        Answer all {exercises.length} exercises on your own —
                                        no hints, no help. That's how real learning happens.
                                    </p>

                                    <div className="exercises-list">
                                        {exercises.map((ex, i) => (
                                            <div
                                                key={ex.id}
                                                className={`exercise-card ${isAnswered(ex) ? 'answered' : ''}`}
                                            >
                                                <div className="exercise-num">
                                                    Exercise {i + 1} / {exercises.length}
                                                </div>
                                                <div className="exercise-instruction">
                                                    {ex.instruction}
                                                </div>
                                                <div className="exercise-question">
                                                    {/* For word_order, question is an array — show scrambled */}
                                                    {ex.type === 'word_order'
                                                        ? `Rearrange: ${(ex.question as string[]).sort(() => Math.random() - .5).join(' / ')}`
                                                        : ex.question as string
                                                    }
                                                </div>

                                                {/* Exercise-specific input */}
                                                {ex.type === 'fill_blank' && (
                                                    <FillBlankExercise
                                                        exercise={ex}
                                                        answer={(answers[ex.id] as string) ?? ''}
                                                        onChange={v => setAnswer(ex.id, v)}
                                                    />
                                                )}

                                                {ex.type === 'multiple_choice' && (
                                                    <MultipleChoiceExercise
                                                        exercise={ex}
                                                        answer={(answers[ex.id] as number) ?? null}
                                                        onChange={v => setAnswer(ex.id, v)}
                                                    />
                                                )}

                                                {(ex.type === 'error_correction') && (
                                                    <ErrorCorrectionExercise
                                                        answer={(answers[ex.id] as string) ?? ''}
                                                        onChange={v => setAnswer(ex.id, v)}
                                                    />
                                                )}

                                                {ex.type === 'word_order' && (
                                                    <WordOrderExercise
                                                        words={ex.question as string[]}
                                                        sentenceIndices={(answers[ex.id] as number[]) ?? []}
                                                        onChange={v => setAnswer(ex.id, v)}
                                                    />
                                                )}

                                                {ex.type === 'translation_es_to_en' && (
                                                    <TranslationExercise
                                                        exercise={ex}
                                                        answer={(answers[ex.id] as string) ?? ''}
                                                        onChange={v => setAnswer(ex.id, v)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="lesson-actions">
                                        <button
                                            className="btn-lesson-secondary"
                                            onClick={() => setPhase('theory')}
                                        >
                                            ← Review theory
                                        </button>
                                        <button
                                            className="btn-lesson-primary"
                                            disabled={!allAnswered}
                                            onClick={submitAnswers}
                                        >
                                            Submit answers
                                        </button>
                                    </div>
                                </>
                            )
                        }
                    </>
                )}

                {/* ── PHASE: RESULTS ────────────────────────────────────── */}
                {phase === 'results' && evaluation && (
                    <>
                        {loading
                            ? <LoadingState message={loadingMsg} />
                            : (
                                <>
                                    {/* Score display */}
                                    <div className="results-score">
                                        <div className={`results-score-num ${evaluation.passed ? 'passed' : 'failed'}`}>
                                            {evaluation.overall_score}
                                            <span style={{ fontSize: 28, fontFamily: 'DM Sans' }}>/100</span>
                                        </div>
                                        <div className="results-verdict">
                                            {evaluation.passed
                                                ? '🎉 Great job! Lesson completed.'
                                                : '📚 Keep practicing — you\'re getting there.'}
                                        </div>
                                        <p className="results-feedback-summary">
                                            {evaluation.feedback_summary}
                                        </p>
                                    </div>

                                    {/* Per-exercise breakdown */}
                                    {evaluation.exercises.length > 0 && (
                                        <div className="results-exercises">
                                            {evaluation.exercises.map((res, i) => {
                                                const ex = exercises.find(e => e.id === res.id)
                                                return (
                                                    <div
                                                        key={res.id}
                                                        className={`result-exercise-card ${res.correct ? 'correct' : 'incorrect'}`}
                                                    >
                                                        <div className={`result-icon ${res.correct ? 'correct' : 'incorrect'}`}>
                                                            {res.correct ? '✓' : '✗'}
                                                        </div>
                                                        <div className="result-body">
                                                            <div className="result-question">
                                                                {typeof ex?.question === 'string'
                                                                    ? ex.question
                                                                    : `Exercise ${i + 1}`}
                                                            </div>
                                                            {!res.correct && (
                                                                <div className="result-answers">
                                                                    <span className="yours">
                                                                        Your answer: {String(res.student_answer)}
                                                                    </span>
                                                                    {' · '}
                                                                    <span className="correct-ans">
                                                                        Correct: {String(res.correct_answer)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="result-fb">{res.feedback}</div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="lesson-actions">
                                        {evaluation.passed ? (
                                            <button
                                                className="btn-lesson-primary"
                                                disabled={completing}
                                                onClick={completeLesson}
                                            >
                                                {completing ? 'Saving...' : 'Complete lesson →'}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn-lesson-secondary"
                                                    onClick={() => setPhase('theory')}
                                                >
                                                    Review theory
                                                </button>
                                                <button
                                                    className="btn-lesson-primary"
                                                    onClick={retry}
                                                >
                                                    Try again with new exercises
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )
                        }
                    </>
                )}

            </div>
        </AppLayout>
    )
}
