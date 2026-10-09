import React, { useEffect, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import axios from 'axios';
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import VocabLessonContent, { type FocusWord } from './VocabLessonContent'
import '../lessons.css'
import './session.css'
import { LESSON_STRINGS, lessonLocale, type LessonStrings } from '@/lib/lesson-i18n'

// ─── Types ────────────────────────────────────────────────────────────────────

type ExerciseType = 'fill_blank' | 'multiple_choice' | 'error_correction' | 'word_order' | 'translation_es_to_en'

interface Exercise {
    id: string
    type: ExerciseType
    instruction: string
    question: string | string[]
    options?: string[]
    answer: string | number
}

interface GeneratedSession {
    aspect: string
    grammar_points_covered: string[]
    focus_words?: FocusWord[]
    is_consolidation: boolean
    warmup?: {
        intro: string
        exercises: Exercise[]
    }
    mini_lesson: {
        title: string
        html: string
    }
    practice: {
        intro: string
        exercises: Exercise[]
    }
    free_production: {
        prompt: string
        target_structures: string[]
        min_words: number
    }
}

interface SessionState {
    session_number: number
    is_first_session: boolean
    aspects_covered: string[]
    aspects_remaining: string[]
    cumulative_score: number
    sessions_done: number
    min_sessions_met: boolean
}

interface ExerciseResult {
    id: string
    correct: boolean
    student_answer: string | number
    correct_answer: string | number
    feedback: string
}

interface Evaluation {
    session_score: number
    errors_this_session: string[]
    warmup_performance: string
    exercise_results: ExerciseResult[]
    free_production_feedback: string
    encouragement: string
}

interface SessionResult {
    mastered: boolean
    session_score: number
    cumulative_score: number
    sessions_count: number
    aspects_remaining: string[]
    next_step: 'topic_completed' | 'needs_consolidation' | 'next_session'
}

interface SessionPageProps {
    topic: {
        id: number
        order: number
        title: string
        description: string
    }
    sessionState: SessionState
    level?: string
    passThreshold?: number
}

type Phase = 'loading' | 'warmup' | 'lesson' | 'practice' | 'production' | 'evaluating' | 'results'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const csrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''

async function postJson(url: string, body: object) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
        body: JSON.stringify(body),
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
        // Aseguramos que sea un arreglo, si es string lo dividimos por espacios
        const words = Array.isArray(ex.question)
            ? ex.question
            : (typeof ex.question === 'string' ? ex.question.split(' ') : []);

        return raw.map(i => words[i]).join(' ')
    }
    return raw as string | number
}

// ─── Exercise renderer ────────────────────────────────────────────────────────

function ExerciseInput({
    exercise, answer, onChange, t,
}: {
    exercise: Exercise
    answer: string | number | number[] | undefined
    onChange: (v: string | number | number[]) => void
    t: LessonStrings
}) {
    switch (exercise.type) {
        case 'fill_blank':
            return (
                <input
                    className="fill-input"
                    type="text"
                    value={(answer as string) ?? ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={t.typeAnswer}
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
                        ? t.writeTranslation
                        : t.writeCorrected}
                />
            )

        case 'word_order': {
            // Protección: forzamos a que sea un arreglo para evitar que .map() explote
            const words = Array.isArray(exercise.question)
                ? exercise.question
                : (typeof exercise.question === 'string' ? exercise.question.split(' ') : []);

            const selected: number[] = Array.isArray(answer) ? (answer as number[]) : []
            const usedSet = new Set(selected)

            return (
                <>
                    <div className={`word-builder ${selected.length > 0 ? 'has-words' : ''}`}>
                        {selected.length === 0
                            ? <span className="word-builder-placeholder">{t.clickWords}</span>
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
                            <button className="word-clear-btn" onClick={() => onChange([])}>{t.clearWords}</button>
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
    exercise, index, total, answer, onChange, t,
}: {
    exercise: Exercise
    index: number
    total: number
    answer: string | number | number[] | undefined
    onChange: (v: string | number | number[]) => void
    t: LessonStrings
}) {
    const isAnswered = answer !== undefined && answer !== null &&
        (typeof answer === 'string' ? answer.trim() !== '' :
            Array.isArray(answer) ? answer.length > 0 : true)

    // Validación segura para el .join()
    const questionText = exercise.type === 'word_order'
        ? `${t.arrangeWords} ${Array.isArray(exercise.question) ? exercise.question.join(' / ') : exercise.question}`
        : exercise.question as string

    return (
        <div className={`exercise-card ${isAnswered ? 'answered' : ''}`}>
            <div className="exercise-num">{t.exerciseNum(index + 1, total)}</div>
            <div className="exercise-instruction">{exercise.instruction}</div>
            <div className="exercise-question">{questionText}</div>
            <ExerciseInput exercise={exercise} answer={answer} onChange={onChange} t={t} />
        </div>
    )
}

// ─── Loading ──────────────────────────────────────────────────────────────────

// Una sola barra, por bloques. Generar es UNA petición HTTP, así que no hay progreso
// real que reportar: los bloques avanzan por tiempo con la etiqueta de lo que está
// pasando, y el último solo se llena cuando llega la respuesta. Así la barra no promete
// algo que no sabe.
function Loading({ message, stages, step, onRetry, t }: {
    message: string
    stages: string[]
    step: number
    onRetry?: () => void
    t: LessonStrings
}) {
    const failed = Boolean(onRetry)
    const current = stages[Math.min(step, stages.length - 1)] ?? message

    return (
        <div className="lesson-loading">
            {!failed && stages.length > 0 && (
                <>
                    <div
                        className="load-bar"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={stages.length}
                        aria-valuenow={step}
                        aria-label={current}
                    >
                        {stages.map((_, i) => (
                            <span
                                key={i}
                                className={`load-block${i < step ? ' done' : i === step ? ' active' : ''}`}
                            />
                        ))}
                    </div>
                    <p className="lesson-loading-msg">
                        {current}
                        <span className="load-count"> · {Math.min(step + 1, stages.length)}/{stages.length}</span>
                    </p>
                </>
            )}
            {failed && <p className="lesson-loading-msg">{message}</p>}
            {onRetry && (
                <button className="btn-lesson-primary" onClick={onRetry}>
                    ↻ {t.tryAgain}
                </button>
            )}
        </div>
    )
}

// ─── Phase bar ────────────────────────────────────────────────────────────────

function PhaseBar({ phase, hasWarmup, t }: { phase: Phase; hasWarmup: boolean; t: LessonStrings }) {
    const steps: { id: Phase; label: string }[] = [
        ...(hasWarmup ? [{ id: 'warmup' as Phase, label: t.phaseWarmup }] : []),
        { id: 'lesson', label: t.phaseLesson },
        { id: 'practice', label: t.phasePractice },
        { id: 'production', label: t.phaseWriting },
        { id: 'results', label: t.phaseResults },
    ]
    const order = steps.map(s => s.id)
    const currentIdx = order.indexOf(phase === 'evaluating' ? 'production' : phase)

    return (
        <div className="phase-bar">
            {steps.map((s, i) => {
                const done = i < currentIdx
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

export default function SessionPage({ topic, sessionState, level = 'B1' }: SessionPageProps) {
    // El botón de traductor solo se ofrece en A2 (A1 ya viene en español; B1+ se queda en inglés)
    const canTranslate = level === 'A2'
    // Idioma de la interfaz según el nivel: A1/A2 en español, B1+ en inglés
    const t = LESSON_STRINGS[lessonLocale(level)]
    const [phase, setPhase] = useState<Phase>('loading')
    const [loadingMsg, setLoadingMsg] = useState(t.preparing)
    const [loadError, setLoadError] = useState(false)
    const [loadStep, setLoadStep]   = useState(0)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [session, setSession] = useState<GeneratedSession | null>(null)
    const [sessionId, setSessionId] = useState<number | null>(null)

    const [warmupAnswers, setWarmupAnswers] = useState<Record<string, string | number | number[]>>({})
    const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string | number | number[]>>({})
    const [suggestedActivity, setSuggestedActivity] = useState<{ id: number; type?: string; title: string; artist: string } | null>(null)
    const [productionText, setProductionText] = useState('')

    const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
    const [result, setResult] = useState<SessionResult | null>(null)

    const [lessonHtml, setLessonHtml] = useState<string>('')
    const [isTranslating, setIsTranslating] = useState<boolean>(false)
    const [isTraducido, setIsTraducido] = useState<boolean>(false)
    const [translationsCache, setTranslationsCache] = useState<Record<string, string>>({})

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Lessons', href: '/lessons' },
        { title: topic.title, href: '#' },
    ]

    // ── Generate session on mount ────────────────────────────────────────────
    useEffect(() => { generate() }, [])

    useEffect(() => {
        if (session?.mini_lesson?.html) {
            setLessonHtml(session.mini_lesson.html)
            setIsTraducido(false)
        }
    }, [session])

    async function generate() {
        setPhase('loading')
        setLoadError(false)
        setLoadingMsg(t.preparing)
        try {
            const data = await postJson((window as any).route('lessons.session.generate'), {
                topic_id: topic.id,
            })
            if (data.error || !data.session) {
                setLoadingMsg(t.genFailed)
                setLoadError(true)
                return
            }
            setSession(data.session)
            setSessionId(data.session_id)
            // Primera fase: warmup si existe, si no lesson
            setPhase(data.session.warmup ? 'warmup' : 'lesson')
        } catch {
            setLoadingMsg(t.connError)
            setLoadError(true)
        }
    }

    async function handleTranslate() {
        if (!session) return

        // Si ya está traducido, volvemos al original (Gratis, en memoria)
        if (isTraducido) {
            setLessonHtml(session.mini_lesson.html)
            setIsTraducido(false)
            return
        }

        const originalHtml = session.mini_lesson.html

        // 🧠 CLAVE FRONTEND: ¿Ya tradujimos este texto exacto en esta sesión?
        if (translationsCache[originalHtml]) {
            setLessonHtml(translationsCache[originalHtml]) // Lo recuperamos al instante
            setIsTraducido(true)
            return // 🛑 Detener aquí. No toca la red, costo $0.
        }

        setIsTranslating(true)
        try {
            const respuesta = await axios.post('/traducir', {
                texto: originalHtml,
                idioma_destino: 'es' 
            })
            
            const textoTraducido = respuesta.data.traducido

            // 💾 Guardamos en la caché de React antes de pintar
            setTranslationsCache(prev => ({
                ...prev,
                [originalHtml]: textoTraducido
            }))

            setLessonHtml(textoTraducido)
            setIsTraducido(true)
        } catch (error) {
            console.error("Error al traducir:", error)
            alert("No se pudo traducir la lección en este momento.")
        } finally {
            setIsTranslating(false)
        }
    }

    // ── Submit ───────────────────────────────────────────────────────────────
    // Avance de la barra mientras se espera. Se detiene en el último bloque y no lo
    // rebasa: ese lo cierra la respuesta real, no el reloj.
    const loadStages = phase === 'evaluating' ? t.stagesEvaluate : t.stagesGenerate

    useEffect(() => {
        const cargando = (phase === 'loading' || phase === 'evaluating') && !loadError && !submitError
        if (!cargando) return

        setLoadStep(0)
        const tope = Math.max(loadStages.length - 1, 0)
        const id = window.setInterval(
            () => setLoadStep(prev => (prev >= tope ? tope : prev + 1)),
            6000,
        )

        return () => window.clearInterval(id)
    }, [phase, loadError, submitError, loadStages.length])

    async function submit() {
        if (!session || !sessionId) return
        setSubmitError(null)
        setPhase('evaluating')
        setLoadingMsg(t.checking)

        // Las opciones viajan con el ejercicio: sin ellas, en un multiple_choice el
        // evaluador solo ve indices y no puede decirle al alumno que decia la opcion
        // correcta ("elegiste 2, era 0" no ensena nada).
        const forEval = (ex: Exercise, raw: string | number | number[] | undefined) => ({
            id: ex.id, type: ex.type, question: ex.question,
            options: ex.options ?? null, answer: ex.answer,
            student_answer: resolveStudentAnswer(ex, raw),
        })

        const warmupSub   = (session.warmup?.exercises ?? []).map(ex => forEval(ex, warmupAnswers[ex.id]))
        const practiceSub = session.practice.exercises.map(ex => forEval(ex, practiceAnswers[ex.id]))

        const submission = {
            aspect: session.aspect,
            grammar_points_covered: session.grammar_points_covered,
            warmup_answers: warmupSub,
            practice_answers: practiceSub,
            free_production: {
                prompt: session.free_production.prompt,
                // El evaluador necesita saber que estructuras se exigieron: si no, no puede
                // juzgar si el alumno las uso (y las exigencias viven aqui, no solo en el prompt).
                target_structures: session.free_production.target_structures,
                text: productionText,
            },
            focus_words: session.focus_words ?? [],
        }

        try {
            const data = await postJson((window as any).route('lessons.session.submit'), {
                topic_id: topic.id,
                session_id: sessionId,
                submission,
            })
            if (data.error) {
                setSubmitError(t.evalFailed)
                setPhase('production')
                return
            }
            setEvaluation(data.evaluation)
            setResult(data.result)
            setSuggestedActivity(data.suggest_activity ?? null)
            setPhase('results')
        } catch {
            setSubmitError(t.evalConnError)
            setPhase('production')
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

    const wordCount = countWords(productionText)
    const productionOk = session ? wordCount >= session.free_production.min_words : false

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Session: ${topic.title}`} />

            <div className="lesson-root">

                {session && phase !== 'loading' && (
                    <PhaseBar phase={phase} hasWarmup={!!session.warmup} t={t} />
                )}

                {/* Topic + session meta */}
                <div className="lesson-topic-header">
                    <div className="lesson-topic-label">
                        {t.topicSession(topic.order, sessionState.session_number)}
                    </div>
                    <div className="lesson-topic-title">{topic.title}</div>
                </div>

                {session && phase !== 'loading' && phase !== 'results' && (
                    <div className="session-meta">
                        <span className="session-meta-item">
                            {t.todaysFocus} <strong>{session.aspect}</strong>
                        </span>
                        {sessionState.cumulative_score > 0 && (
                            <span className="session-meta-item">
                                {t.progressSoFar} <strong>{sessionState.cumulative_score}/100</strong>
                            </span>
                        )}
                        {session.is_consolidation && (
                            <span className="session-meta-item">
                                <strong>{t.consolidation}</strong>
                            </span>
                        )}
                    </div>
                )}

                {/* ── LOADING / EVALUATING ── */}
                {(phase === 'loading' || phase === 'evaluating') && (
                    <Loading
                        message={loadingMsg}
                        stages={loadStages}
                        step={loadStep}
                        onRetry={phase === 'loading' && loadError ? generate : undefined}
                        t={t}
                    />
                )}

                {/* ── WARM-UP ── */}
                {phase === 'warmup' && session?.warmup && (
                    <>
                        <div className="warmup-banner">
                            {t.warmupBanner}
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
                                    t={t}
                                />
                            ))}
                        </div>

                        <div className="lesson-actions">
                            <button
                                className="btn-lesson-primary"
                                disabled={!warmupComplete}
                                onClick={() => setPhase('lesson')}
                            >
                                {t.continueToLesson}
                            </button>
                        </div>
                    </>
                )}

                {/* ── MINI-LESSON ── */}
                {/* ── MINI-LESSON ── */}
                {phase === 'lesson' && session && (
                    <>
                        <div className="card">
                            <div className="card-body">

                                {/* Botón de traducción — solo nivel A2 */}
                                {canTranslate && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                    <button
                                        onClick={handleTranslate}
                                        disabled={isTranslating}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            cursor: isTranslating ? 'not-allowed' : 'pointer',
                                            backgroundColor: isTranslating ? '#f3f4f6' : (isTraducido ? '#dcfce7' : '#eff6ff'),
                                            color: isTranslating ? '#9ca3af' : (isTraducido ? '#15803d' : '#2563eb'),
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <span>🌐</span>
                                        {isTranslating ? 'Traduciendo...' : isTraducido ? 'Ver Original (EN)' : 'Traducir al Español'}
                                    </button>
                                </div>
                                )}

                                {/* Se reemplaza session.mini_lesson.html por lessonHtml */}
                                <VocabLessonContent
                                    html={lessonHtml || session.mini_lesson.html}
                                    words={session.focus_words ?? []}
                                />
                                <div className="lesson-actions">
                                    <button className="btn-lesson-primary" onClick={() => setPhase('practice')}>
                                        {t.readyToPractice}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── PRACTICE ── */}
                {phase === 'practice' && session && (
                    <>
                        <p className="phase-intro">
                            {session.practice.intro} {t.practiceHint}
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
                                    t={t}
                                />
                            ))}
                        </div>

                        <div className="lesson-actions">
                            <button
                                className="btn-lesson-primary"
                                disabled={!practiceComplete}
                                onClick={() => setPhase('production')}
                            >
                                {t.continueToWriting}
                            </button>
                        </div>
                    </>
                )}

                {/* ── FREE PRODUCTION ── */}
                {phase === 'production' && session && (
                    <>
                        <div className="production-prompt-box">
                            <div className="production-prompt-label">{t.writingTask}</div>
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
                            placeholder={t.writePlaceholder}
                        />
                        <div className={`word-count ${productionOk ? 'met' : ''}`}>
                            {wordCount} / {session.free_production.min_words} {t.wordsMinimum}
                        </div>
                        {submitError && (
                            <div className="warmup-banner" style={{ marginTop: 12 }}>⚠ {submitError}</div>
                        )}

                        <div className="lesson-actions">
                            <button
                                className="btn-lesson-secondary"
                                onClick={() => setPhase('practice')}
                            >
                                {t.back}
                            </button>
                            <button
                                className="btn-lesson-primary"
                                disabled={!productionOk}
                                onClick={submit}
                            >
                                {t.submitSession}
                            </button>
                        </div>
                    </>
                )}

                {/* ── RESULTS ── */}
                {phase === 'results' && evaluation && result && (
                    <>
                        {/* Mastery banner */}
                        <div className={`mastery-banner ${result.next_step === 'topic_completed' ? 'completed' :
                            result.next_step === 'needs_consolidation' ? 'consolidation' : 'next'
                            }`}>
                            <div className="mastery-emoji">
                                {result.next_step === 'topic_completed' ? '🎉' :
                                    result.next_step === 'needs_consolidation' ? '💪' : '📈'}
                            </div>
                            <div className="mastery-title">
                                {result.next_step === 'topic_completed' ? t.verdictMastered :
                                    result.next_step === 'needs_consolidation' ? t.verdictAlmost : t.verdictProgress}
                            </div>
                            <p className="mastery-msg">
                                {result.next_step === 'topic_completed'
                                    ? t.msgMastered
                                    : result.next_step === 'needs_consolidation'
                                        ? t.msgAlmost
                                        : `${evaluation.encouragement} ${t.keepBuilding}`}
                            </p>

                            <div className="score-chips">
                                <div className="score-chip">
                                    <div className="score-chip-num">{result.session_score}</div>
                                    <div className="score-chip-label">{t.chipThisSession}</div>
                                </div>
                                <div className="score-chip">
                                    <div className="score-chip-num">{result.cumulative_score}</div>
                                    <div className="score-chip-label">{t.chipTopicAverage}</div>
                                </div>
                                <div className="score-chip">
                                    <div className="score-chip-num">{result.sessions_count}</div>
                                    <div className="score-chip-label">{t.chipSessionsDone}</div>
                                </div>
                            </div>
                        </div>

                        {/* Free production feedback */}
                        {evaluation.free_production_feedback && (
                            <div className="production-fb-box">
                                <div className="production-fb-label">{t.writingFeedback}</div>
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
                                                    <span className="yours">{t.youAnswered} {String(res.student_answer)}</span>
                                                    {' · '}
                                                    <span className="correct-ans">{t.correctAnswer} {String(res.correct_answer)}</span>
                                                </div>
                                            )}
                                            <div className="result-fb">{res.feedback}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {suggestedActivity && (
                            <div className="listening-suggest">
                                <span className="listening-suggest-icon">
                                    {suggestedActivity.type === 'clip' ? '🎬' : '🎧'}
                                </span>
                                <div className="listening-suggest-body">
                                    <div className="listening-suggest-label">
                                        {suggestedActivity.type === 'clip'
                                            ? 'Movie break — watch a scene and answer'
                                            : 'Listening break — train your ear'}
                                    </div>
                                    <div className="listening-suggest-title">{suggestedActivity.title}</div>
                                    <div className="listening-suggest-artist">{suggestedActivity.artist}</div>
                                </div>
                                <button
                                    className="btn-lesson-primary"
                                    onClick={() => router.visit(`/listening/${suggestedActivity.id}?from=lesson`)}
                                >
                                    {suggestedActivity.type === 'clip' ? 'Watch →' : 'Play →'}
                                </button>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="lesson-actions">
                            <button
                                className="btn-lesson-secondary"
                                onClick={() => router.visit((window as any).route('lessons.index'))}
                            >
                                {t.backToLessons}
                            </button>
                            {!result.mastered && (
                                <button
                                    className="btn-lesson-primary"
                                    onClick={generate}
                                >
                                    {t.startNextSession}
                                </button>
                            )}
                            {result.mastered && (
                                <button
                                    className="btn-lesson-primary"
                                    onClick={() => router.visit((window as any).route('lessons.index'))}
                                >
                                    {t.continueNextTopic}
                                </button>
                            )}
                        </div>
                    </>
                )}

            </div>
        </AppLayout>
    )
}