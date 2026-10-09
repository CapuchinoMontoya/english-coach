import React, { useState, useEffect, useCallback, useRef } from 'react'
import { router } from '@inertiajs/react'
import axios from 'axios'
import { ArrowLeft, ArrowRight, Check, X, Plus, Sparkles, RotateCcw, Pencil } from 'lucide-react'
import './onboarding.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Option {
    value: string
    label: string
    icon: string
    desc: string
}

interface Step {
    id: string
    eyebrow: string          // etiqueta corta para la barra y el resumen
    question: string
    subtitle: string
    type: 'choice' | 'tags'
    options?: Option[]
    multiple?: boolean
}

type Answers = Record<string, string | string[]>

interface OnboardingProps {
    user: { id: number; name: string }
}

type Phase = 'welcome' | 'questions' | 'review'

const STORAGE_KEY = 'capuchino.onboarding.v2'

// ─── Pasos ────────────────────────────────────────────────────────────────────
// Los `id` y `value` coinciden exactamente con la validación del backend.
// Los textos van en español: es lo primero que ve alguien que aún no sabe inglés.

const STEPS: Step[] = [
    {
        id: 'age_group',
        type: 'choice',
        eyebrow: 'Edad',
        question: '¿Cuántos años tienes?',
        subtitle: 'Con esto ajustamos las referencias culturales de tus lecciones.',
        options: [
            { value: 'under_18', label: 'Menos de 18', icon: '🛹', desc: 'Escuela y adolescencia' },
            { value: '18_25',    label: '18 a 25',     icon: '🎓', desc: 'Universidad y primer trabajo' },
            { value: '26_35',    label: '26 a 35',     icon: '💼', desc: 'Vida profesional' },
            { value: '36_plus',  label: '36 o más',    icon: '🌟', desc: 'Aprendizaje de por vida' },
        ],
    },
    {
        id: 'current_level',
        type: 'choice',
        eyebrow: 'Nivel',
        question: '¿Cómo andas de inglés hoy?',
        subtitle: 'Sé honesto. Después platicamos un rato para medirlo de verdad; esto es solo el punto de partida.',
        options: [
            { value: 'beginner',     label: 'Desde cero', icon: '🌱', desc: 'Sé muy pocas palabras' },
            { value: 'elementary',   label: 'Lo básico',  icon: '🚶', desc: 'Puedo saludar y pedir comida' },
            { value: 'intermediate', label: 'Intermedio', icon: '🏃', desc: 'Sostengo una conversación simple' },
            { value: 'advanced',     label: 'Avanzado',   icon: '🦅', desc: 'Me expreso con comodidad' },
        ],
    },
    {
        id: 'goal',
        type: 'choice',
        eyebrow: 'Meta',
        question: '¿Para qué quieres el inglés?',
        subtitle: 'Todo tu plan se va a construir alrededor de esto.',
        options: [
            { value: 'work',    label: 'Trabajo', icon: '💼', desc: 'Correos, juntas, presentaciones' },
            { value: 'travel',  label: 'Viajar',  icon: '✈️', desc: 'Moverme, pedir, conversar' },
            { value: 'school',  label: 'Escuela', icon: '📚', desc: 'Inglés académico, TOEFL, IELTS' },
            { value: 'general', label: 'Fluidez', icon: '🌍', desc: 'Mejorar en general' },
        ],
    },
    {
        id: 'learning_style',
        type: 'choice',
        eyebrow: 'Estilo',
        question: '¿Cómo aprendes mejor?',
        subtitle: 'Adaptamos la forma de explicarte, no lo que aprendes.',
        options: [
            { value: 'visual',          label: 'Viendo',      icon: '👁️', desc: 'Imágenes, tablas, ejemplos visuales' },
            { value: 'conversational',  label: 'Conversando', icon: '💬', desc: 'Diálogos y práctica en voz alta' },
            { value: 'reading_writing', label: 'Leyendo',     icon: '📝', desc: 'Textos, reglas, lógica del idioma' },
            { value: 'exercises',       label: 'Practicando', icon: '✏️', desc: 'Ejercicios y repetición' },
        ],
    },
    {
        id: 'personality',
        type: 'choice',
        eyebrow: 'Ritmo',
        question: '¿Y hablar en inglés? ¿Cómo lo sientes?',
        subtitle: 'Esto define qué tan rápido te empujamos a producir y cómo te corregimos.',
        options: [
            { value: 'extrovert', label: 'Me lanzo',    icon: '🗣️', desc: 'Hablo aunque me equivoque' },
            { value: 'ambivert',  label: 'Paso a paso', icon: '⚖️', desc: 'Prefiero práctica guiada primero' },
            { value: 'introvert', label: 'Me preparo',  icon: '🕵️', desc: 'Quiero entenderlo antes de hablar' },
        ],
    },
    {
        id: 'interests',
        type: 'tags',
        eyebrow: 'Gustos',
        multiple: true,
        question: '¿De qué te gusta hablar?',
        subtitle: 'Aquí está la magia: tus lecciones van a usar esto en los ejemplos. Pica una burbuja y aparecen más.',
    },
    {
        id: 'time_per_day',
        type: 'choice',
        eyebrow: 'Tiempo',
        question: '¿Cuánto tiempo al día?',
        subtitle: 'Sé realista. La constancia le gana a la intensidad, siempre.',
        options: [
            { value: '10_15',   label: '10 a 15 min', icon: '⚡', desc: 'Sesiones cortas diarias' },
            { value: '20_30',   label: '20 a 30 min', icon: '☕', desc: 'Práctica enfocada' },
            { value: '30_60',   label: '30 a 60 min', icon: '🔥', desc: 'Aprendizaje profundo' },
            { value: '60_plus', label: 'Más de 1 h',  icon: '🚀', desc: 'Entrenamiento intensivo' },
        ],
    },
]

const MIN_INTERESTS = 3

// ─── Catálogo de burbujas ─────────────────────────────────────────────────────

const ROOT_CATEGORIES = ['Music', 'Movies & TV', 'Video Games', 'Sports & Fitness', 'Food & Cooking']

const ROOT_LABELS: Record<string, string> = {
    'Music':            'Música',
    'Movies & TV':      'Cine y series',
    'Video Games':      'Videojuegos',
    'Sports & Fitness': 'Deporte',
    'Food & Cooking':   'Comida',
}

const ROOT_ICONS: Record<string, string> = {
    'Music':            '🎵',
    'Movies & TV':      '🎬',
    'Video Games':      '🎮',
    'Sports & Fitness': '⚽',
    'Food & Cooking':   '🍳',
}

const GENRE_CATEGORIES = [
    'Action', 'Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Documentaries',
    'RPG', 'Shooter', 'Adventure', 'Strategy', 'Puzzle', 'Sports',
    'Rock', 'Pop', 'Rap & Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'Latin',
    'Football', 'Basketball', 'Tennis', 'Baseball', 'Cycling', 'Running',
    'Chicken', 'Seafood', 'Beef', 'Pasta', 'Vegetarian', 'Dessert', 'Breakfast', 'Vegan',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function labelFor(stepId: string, value: string | string[] | undefined): string {
    const step = STEPS.find(s => s.id === stepId)
    if (!step || value === undefined) return '—'
    if (Array.isArray(value)) {
        return value.length ? value.map(v => ROOT_LABELS[v] ?? v).join(' · ') : '—'
    }
    return step.options?.find(o => o.value === value)?.label ?? String(value)
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Onboarding({ user }: OnboardingProps) {
    const firstName = user.name.trim().split(' ')[0]

    const [phase, setPhase]           = useState<Phase>('welcome')
    const [step, setStep]             = useState(0)
    const [answers, setAnswers]       = useState<Answers>({})
    const [submitting, setSubmitting] = useState(false)
    const [direction, setDirection]   = useState<'fwd' | 'back'>('fwd')

    // Burbujas de intereses
    const [subOptions, setSubOptions]         = useState<{ name: string; turns: number }[]>([])
    const [popping, setPopping]               = useState<string[]>([])
    const [loadingFor, setLoadingFor]         = useState<string | null>(null)
    const [customTag, setCustomTag]           = useState('')
    const [activeCategory, setActiveCategory] = useState('')
    const [bubbleError, setBubbleError]       = useState(false)
    const [lastBubble, setLastBubble]         = useState<string | null>(null)

    const advanceTimer = useRef<number | null>(null)
    const currentStep  = STEPS[step]
    const isLastStep   = step === STEPS.length - 1

    // ── Persistencia: si recarga, no pierde lo que ya contestó ──
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY)
            if (!raw) return
            const saved = JSON.parse(raw)
            if (saved?.answers && Object.keys(saved.answers).length) {
                setAnswers(saved.answers)
                setPhase(saved.phase ?? 'questions')
                setStep(Math.min(saved.step ?? 0, STEPS.length - 1))
            }
        } catch { /* sessionStorage no disponible: seguimos sin restaurar */ }
    }, [])

    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step, phase }))
        } catch { /* noop */ }
    }, [answers, step, phase])

    useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current) }, [])

    // ── Respuesta del paso actual ──
    const currentValue = currentStep ? answers[currentStep.id] : undefined
    const selectedList: string[] = Array.isArray(currentValue)
        ? currentValue
        : currentValue ? [currentValue as string] : []

    const canContinue = selectedList.length > 0

    // ── Navegación ──
    const goTo = useCallback((target: number, dir: 'fwd' | 'back' = 'fwd') => {
        if (advanceTimer.current) clearTimeout(advanceTimer.current)
        setDirection(dir)
        setStep(Math.max(0, Math.min(target, STEPS.length - 1)))
    }, [])

    const next = useCallback(() => {
        if (isLastStep) { setDirection('fwd'); setPhase('review') }
        else goTo(step + 1, 'fwd')
    }, [isLastStep, step, goTo])

    const back = useCallback(() => {
        if (phase === 'review') { setDirection('back'); setPhase('questions'); setStep(STEPS.length - 1); return }
        if (step === 0) { setDirection('back'); setPhase('welcome'); return }
        goTo(step - 1, 'back')
    }, [phase, step, goTo])

    // ── Selección en tarjetas, con auto-avance (se siente fluido) ──
    const choose = useCallback((value: string) => {
        setAnswers(a => ({ ...a, [currentStep.id]: value }))
        if (advanceTimer.current) clearTimeout(advanceTimer.current)
        advanceTimer.current = window.setTimeout(() => {
            if (isLastStep) { setDirection('fwd'); setPhase('review') }
            else goTo(step + 1, 'fwd')
        }, 340)
    }, [currentStep, isLastStep, step, goTo])

    // ── Intereses ──
    // Actualizaciones funcionales: si el usuario pica dos burbujas rápido, no se
    // pierde ninguna (antes se usaba el selectedList del render anterior).
    const addInterest = (tag: string) => setAnswers(a => {
        const cur = Array.isArray(a.interests) ? a.interests : []
        return cur.some(t => t.toLowerCase() === tag.toLowerCase()) ? a : { ...a, interests: [...cur, tag] }
    })
    const removeInterest = (tag: string) => setAnswers(a => {
        const cur = Array.isArray(a.interests) ? a.interests : []
        return { ...a, interests: cur.filter(t => t !== tag) }
    })

    const isLevel3 = (name: string) =>
        !ROOT_CATEGORIES.includes(name) && !GENRE_CATEGORIES.includes(name)

    async function popBubble(item: string) {
        // Feedback inmediato: la burbuja revienta y el interés entra al inventario
        // sin esperar la red (antes no pasaba nada visible durante segundos).
        setPopping(p => [...p, item])
        window.setTimeout(() => setPopping(p => p.filter(b => b !== item)), 320)
        addInterest(item)
        setBubbleError(false)
        setLastBubble(item)
        setLoadingFor(item)

        let categoryContext = activeCategory
        if (ROOT_CATEGORIES.includes(item)) {
            categoryContext = item
            setActiveCategory(item)
        }

        try {
            const res = await axios.get((window as any).route('onboarding.interests'), {
                params: { topic: item, category: categoryContext },
            })
            const incoming = (res.data.topics || []).map((name: string) => ({ name, turns: 0 }))

            setSubOptions(prev => {
                const MAX = 12
                let updated = prev.map(b => ({ ...b, turns: isLevel3(b.name) ? b.turns + 1 : b.turns }))
                updated = updated.filter(b => !(isLevel3(b.name) && b.turns >= 3))
                const existing = new Set(updated.map(b => b.name))
                const fresh = incoming.filter((r: { name: string }) => !existing.has(r.name))
                let result = [...updated, ...fresh]
                if (result.length > MAX) {
                    result.sort((a, b) => b.turns - a.turns)
                    result = result.slice(result.length - MAX)
                }
                return result
            })

        } catch {
            // El interés ya quedó guardado; solo avisamos que no hubo sugerencias
            setBubbleError(true)
        } finally {
            setLoadingFor(null)
        }
    }

    function addCustomTag() {
        const tag = customTag.trim()
        if (!tag) return
        addInterest(tag)
        setCustomTag('')
    }

    // ── Envío ──
    const answeredCount = STEPS.filter(s => {
        const v = answers[s.id]
        return Array.isArray(v) ? v.length > 0 : Boolean(v)
    }).length

    const submit = useCallback(() => {
        if (submitting || answeredCount < STEPS.length) return
        setSubmitting(true)
        const payload: Answers = {
            ...answers,
            interests: Array.isArray(answers.interests) ? answers.interests : [],
        }
        try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
        router.post((window as any).route('onboarding.store'), payload as any, {
            preserveState: false,
            onError: () => setSubmitting(false),
        })
    }, [submitting, answeredCount, answers])

    // ── Teclado real: listener en window, no en un div sin foco ──
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const el = e.target as HTMLElement | null
            const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')

            if (phase === 'welcome') {
                if (e.key === 'Enter') { e.preventDefault(); setPhase('questions') }
                return
            }
            if (phase === 'review') {
                if (e.key === 'Enter')  { e.preventDefault(); submit() }
                if (e.key === 'Escape') { e.preventDefault(); back() }
                return
            }
            if (typing) return

            if (e.key === 'Enter' && canContinue) { e.preventDefault(); next() }
            if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); back() }

            if (currentStep?.type === 'choice' && /^[1-9]$/.test(e.key)) {
                const opt = currentStep.options?.[parseInt(e.key, 10) - 1]
                if (opt) { e.preventDefault(); choose(opt.value) }
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [phase, canContinue, currentStep, next, back, choose, submit])

    const pct = phase === 'welcome' ? 0 : phase === 'review' ? 100 : Math.round((step / STEPS.length) * 100)

    // ══════════ Pantalla de envío ══════════
    if (submitting) {
        return (
            <div className="ob-root">
                <div className="ob-building">
                    <div className="ob-building-orb"><Sparkles size={26} /></div>
                    <h1 className="ob-building-title">Armando tu plan, {firstName}</h1>
                    <p className="ob-building-sub">
                        Estamos eligiendo tus temas y preparando a Alex, tu coach, para conocerte.
                    </p>
                    <div className="ob-building-bar"><span /></div>
                </div>
            </div>
        )
    }

    return (
        <div className="ob-root">

            {/* ── Header ── */}
            <header className="ob-header">
                <div className="ob-logo">
                    <span className="ob-logo-mark">C</span>
                    <span className="ob-logo-text">Capuchino</span>
                </div>
                {phase !== 'welcome' && (
                    <span className="ob-header-label">
                        {phase === 'review' ? 'Revisión' : `${step + 1} de ${STEPS.length}`}
                    </span>
                )}
            </header>

            {/* ── Progreso con pasos navegables ── */}
            {phase !== 'welcome' && (
                <div className="ob-progress-wrap">
                    <div
                        className="ob-progress-track"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div className="ob-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="ob-progress-steps">
                        {STEPS.map((s, i) => {
                            const v = answers[s.id]
                            const done = Array.isArray(v) ? v.length > 0 : Boolean(v)
                            const active = phase === 'questions' && i === step
                            const reachable = done || i <= step
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`ob-progress-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                                    disabled={!reachable}
                                    onClick={() => { setPhase('questions'); goTo(i, i < step ? 'back' : 'fwd') }}
                                >
                                    {s.eyebrow}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            <main className="ob-main">

                {/* ══════════ BIENVENIDA ══════════ */}
                {phase === 'welcome' && (
                    <div className="ob-welcome ob-anim-in">
                        <p className="ob-welcome-eyebrow">Bienvenido a Capuchino</p>
                        <h1 className="ob-welcome-title">Hola, <em>{firstName}</em></h1>
                        <p className="ob-welcome-lede">
                            No vas a estudiar un curso genérico. Vamos a construir <strong>tu</strong> plan,
                            con ejemplos sacados de lo que de verdad te interesa.
                        </p>

                        <ul className="ob-welcome-list">
                            <li>
                                <span className="ob-welcome-num">1</span>
                                <div>
                                    <strong>7 preguntas rápidas</strong>
                                    <span>Toma menos de un minuto.</span>
                                </div>
                            </li>
                            <li>
                                <span className="ob-welcome-num">2</span>
                                <div>
                                    <strong>Una plática con Alex</strong>
                                    <span>Tu coach mide tu nivel conversando, sin examen.</span>
                                </div>
                            </li>
                            <li>
                                <span className="ob-welcome-num">3</span>
                                <div>
                                    <strong>Tu plan listo</strong>
                                    <span>Lecciones, vocabulario y música a tu medida.</span>
                                </div>
                            </li>
                        </ul>

                        <button className="ob-btn ob-btn-primary ob-btn-lg" onClick={() => setPhase('questions')}>
                            Empecemos <ArrowRight size={17} />
                        </button>
                        <p className="ob-hint">O presiona <kbd>Enter</kbd></p>
                    </div>
                )}

                {/* ══════════ PREGUNTAS ══════════ */}
                {phase === 'questions' && currentStep && (
                    <div key={step} className={`ob-step ${direction === 'fwd' ? 'ob-anim-in' : 'ob-anim-in-back'}`}>
                        <p className="ob-step-eyebrow">{currentStep.eyebrow}</p>
                        <h1 className="ob-question">{currentStep.question}</h1>
                        <p className="ob-subtitle">{currentStep.subtitle}</p>

                        {currentStep.type === 'tags' ? (
                            <div className="ob-bubbles-ui">
                                <div className="ob-bubbles-container">
                                    {(() => {
                                        // Mantenemos visible la burbuja que está reventando
                                        // para que su animación se complete.
                                        const keep = (n: string) => !selectedList.includes(n) || popping.includes(n)
                                        const visible = [
                                            ...ROOT_CATEGORIES
                                                .filter(keep)
                                                .map(name => ({ name, isRoot: true })),
                                            ...subOptions
                                                .filter(c => keep(c.name))
                                                .map(c => ({ name: c.name, isRoot: false })),
                                        ]
                                        if (!visible.length && !loadingFor) {
                                            return (
                                                <div className="ob-bubbles-empty">
                                                    <p>Ya elegiste todo lo que te mostramos.</p>
                                                    <button
                                                        className="ob-btn ob-btn-ghost ob-btn-sm"
                                                        onClick={() => lastBubble && popBubble(lastBubble)}
                                                    >
                                                        <RotateCcw size={14} /> Traer más ideas
                                                    </button>
                                                </div>
                                            )
                                        }
                                        return <>
                                            {visible.map((b, i) => (
                                            <button
                                                type="button"
                                                key={b.name}
                                                className={`bubble ${popping.includes(b.name) ? 'popping' : ''} ${b.isRoot ? 'bubble-root' : ''}`}
                                                style={{ animationDelay: popping.includes(b.name) ? '0s' : `${i * 0.04}s` }}
                                                onClick={() => popBubble(b.name)}
                                                aria-label={`Agregar ${ROOT_LABELS[b.name] ?? b.name}`}
                                            >
                                                {b.isRoot && ROOT_ICONS[b.name] && (
                                                    <span className="bubble-icon">{ROOT_ICONS[b.name]}</span>
                                                )}
                                                {ROOT_LABELS[b.name] ?? b.name}
                                            </button>
                                            ))}
                                            {loadingFor && [0, 1, 2, 3].map(i => (
                                                <span
                                                    key={`sk-${i}`}
                                                    className="bubble-skeleton"
                                                    style={{ width: 84 + (i % 3) * 28, animationDelay: `${i * 0.12}s` }}
                                                    aria-hidden="true"
                                                />
                                            ))}
                                        </>
                                    })()}
                                </div>

                                {loadingFor && (
                                    <p className="ob-bubbles-loading" aria-live="polite">
                                        <span className="ob-spinner" aria-hidden="true" />
                                        Buscando más temas como <strong>{ROOT_LABELS[loadingFor] ?? loadingFor}</strong>…
                                    </p>
                                )}

                                {bubbleError && (
                                    <p className="ob-bubble-error">
                                        No pudimos traer más ideas ahora. Tu selección se guardó; puedes escribir tus temas abajo.
                                    </p>
                                )}

                                <div className="ob-custom-row">
                                    <input
                                        type="text"
                                        value={customTag}
                                        onChange={e => setCustomTag(e.target.value)}
                                        placeholder="¿No lo ves? Escríbelo tú…"
                                        className="ob-custom-input"
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
                                        aria-label="Agregar un interés propio"
                                    />
                                    <button className="ob-custom-btn" onClick={addCustomTag} disabled={!customTag.trim()}>
                                        <Plus size={15} /> Agregar
                                    </button>
                                </div>

                                <div className="ob-inventory">
                                    <div className="ob-inventory-head">
                                        <span className="ob-inventory-title">Tus intereses</span>
                                        <span className={`ob-inventory-count ${selectedList.length >= MIN_INTERESTS ? 'ok' : ''}`}>
                                            {selectedList.length === 0
                                                ? `Elige al menos ${MIN_INTERESTS}`
                                                : selectedList.length < MIN_INTERESTS
                                                    ? `${selectedList.length} de ${MIN_INTERESTS} recomendados`
                                                    : `${selectedList.length} seleccionados`}
                                        </span>
                                    </div>
                                    {selectedList.length === 0 ? (
                                        <p className="ob-inventory-empty">Pica una burbuja para empezar.</p>
                                    ) : (
                                        <div className="ob-tags-inventory">
                                            {selectedList.map(tag => (
                                                <span key={tag} className="ob-badge">
                                                    {ROOT_ICONS[tag] && <span className="ob-badge-icon">{ROOT_ICONS[tag]}</span>}
                                                    {ROOT_LABELS[tag] ?? tag}
                                                    <button
                                                        className="ob-badge-remove"
                                                        onClick={() => removeInterest(tag)}
                                                        aria-label={`Quitar ${ROOT_LABELS[tag] ?? tag}`}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="ob-cards">
                                {currentStep.options?.map((opt, i) => {
                                    const isSel = selectedList.includes(opt.value)
                                    return (
                                        <button
                                            type="button"
                                            key={opt.value}
                                            className={`ob-card ${isSel ? 'selected' : ''}`}
                                            onClick={() => choose(opt.value)}
                                            aria-pressed={isSel}
                                        >
                                            <span className="ob-card-key" aria-hidden="true">{i + 1}</span>
                                            <span className="ob-card-icon" aria-hidden="true">{opt.icon}</span>
                                            <span className="ob-card-title">{opt.label}</span>
                                            <span className="ob-card-desc">{opt.desc}</span>
                                            {isSel && <span className="ob-card-check"><Check size={13} /></span>}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        <div className="ob-actions">
                            <button className="ob-btn ob-btn-ghost" onClick={back}>
                                <ArrowLeft size={16} /> Atrás
                            </button>
                            <button className="ob-btn ob-btn-primary" onClick={next} disabled={!canContinue}>
                                {isLastStep ? 'Revisar' : 'Continuar'} <ArrowRight size={16} />
                            </button>
                        </div>
                        <p className="ob-hint">
                            {currentStep.type === 'choice'
                                ? <>Usa las teclas <kbd>1</kbd>–<kbd>{currentStep.options?.length ?? 4}</kbd>, o <kbd>Esc</kbd> para volver</>
                                : <>Presiona <kbd>Enter</kbd> para continuar</>}
                        </p>
                    </div>
                )}

                {/* ══════════ RESUMEN EDITABLE ══════════ */}
                {phase === 'review' && (
                    <div className="ob-step ob-anim-in">
                        <p className="ob-step-eyebrow">Último paso</p>
                        <h1 className="ob-question">Esto es lo que entendimos</h1>
                        <p className="ob-subtitle">
                            Toca cualquier línea para corregirla. Con esto Alex te conoce antes de hablar contigo.
                        </p>

                        <div className="ob-review">
                            {STEPS.map((s, i) => {
                                const v = answers[s.id]
                                const empty = Array.isArray(v) ? !v.length : !v
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className={`ob-review-row ${empty ? 'empty' : ''}`}
                                        onClick={() => { setPhase('questions'); goTo(i, 'back') }}
                                    >
                                        <span className="ob-review-label">{s.eyebrow}</span>
                                        <span className="ob-review-value">{empty ? 'Sin responder' : labelFor(s.id, v)}</span>
                                        <span className="ob-review-edit"><Pencil size={13} /></span>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="ob-actions">
                            <button className="ob-btn ob-btn-ghost" onClick={back}>
                                <ArrowLeft size={16} /> Atrás
                            </button>
                            <button
                                className="ob-btn ob-btn-primary"
                                onClick={submit}
                                disabled={answeredCount < STEPS.length}
                            >
                                Conocer a Alex <ArrowRight size={16} />
                            </button>
                        </div>
                        <p className="ob-hint">
                            {answeredCount < STEPS.length
                                ? 'Completa las respuestas que faltan para continuar'
                                : <>Presiona <kbd>Enter</kbd> para empezar tu evaluación</>}
                        </p>
                    </div>
                )}
            </main>
        </div>
    )
}
