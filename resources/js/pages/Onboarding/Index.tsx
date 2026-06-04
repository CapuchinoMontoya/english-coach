import React, { useState, useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'
import axios from 'axios'
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
    question: string
    subtitle: string
    type: 'choice' | 'tags'
    options?: Option[]
    multiple?: boolean
}

interface Answers {
    [key: string]: string | string[]
}

interface User {
    id: number
    name: string
}

interface OnboardingProps {
    user: User
}

// ─── Steps data ───────────────────────────────────────────────────────────────

const STEPS: Step[] = [
    {
        id: 'age_group',
        type: 'choice',
        question: 'How old are you?',
        subtitle: 'This helps us tailor the cultural references in your lessons.',
        options: [
            { value: 'under_18', label: 'Under 18', icon: '🛹', desc: 'School & teens' },
            { value: '18_25', label: '18 - 25', icon: '🎓', desc: 'University & early career' },
            { value: '26_35', label: '26 - 35', icon: '💼', desc: 'Professionals' },
            { value: '36_plus', label: '36+', icon: '🌟', desc: 'Adults & lifelong learners' },
        ],
    },
    {
        id: 'current_level',
        type: 'choice',
        question: 'What is your current English level?',
        subtitle: 'Don\'t worry, we will still do a quick placement test to be sure.',
        options: [
            { value: 'beginner', label: 'Absolute Beginner', icon: '🌱', desc: 'I know very few words.' },
            { value: 'elementary', label: 'Elementary', icon: '🚶', desc: 'I can order food and say hi.' },
            { value: 'intermediate', label: 'Intermediate', icon: '🏃', desc: 'I can hold a basic conversation.' },
            { value: 'advanced', label: 'Advanced', icon: '🦅', desc: 'I can express myself comfortably.' },
        ],
    },
    {
        id: 'goal',
        type: 'choice',
        question: "What's your main goal?",
        subtitle: 'Your entire plan will be focused around what matters most to you.',
        options: [
            { value: 'work', label: 'Work & Career', icon: '💼', desc: 'Emails, meetings, presentations' },
            { value: 'travel', label: 'Travel', icon: '✈️', desc: 'Conversations, navigation, culture' },
            { value: 'school', label: 'School & Exams', icon: '📚', desc: 'Academic English, TOEFL, IELTS' },
            { value: 'general', label: 'General fluency', icon: '🌍', desc: 'Overall improvement' },
        ],
    },
    {
        id: 'learning_style',
        type: 'choice',
        question: 'How do you learn best?',
        subtitle: 'We will adapt your materials to what actually clicks for you.',
        options: [
            { value: 'visual', label: 'Visual & Context', icon: '👁️', desc: 'Images, diagrams, and video examples' },
            { value: 'conversational', label: 'Listening & Talking', icon: '💬', desc: 'Podcasts, roleplays, out-loud practice' },
            { value: 'reading_writing', label: 'Reading & Writing', icon: '📝', desc: 'Articles, grammar rules, text logic' },
            { value: 'exercises', label: 'Hands-on Practice', icon: '✏️', desc: 'Quizzes, drag & drop, repetition' },
        ],
    },
    {
        id: 'personality',
        type: 'choice',
        question: 'How do you feel about speaking practice?',
        subtitle: 'This helps us adjust the pace and how we correct your mistakes.',
        options: [
            { value: 'extrovert', label: 'Dive right in', icon: '🗣️', desc: 'I love talking right away, even with mistakes.' },
            { value: 'ambivert', label: 'Step by step', icon: '⚖️', desc: 'I like guided practice before free-talking.' },
            { value: 'introvert', label: 'Prepare first', icon: '🕵️', desc: 'I want to master grammar/vocab before speaking.' },
        ],
    },
    {
        id: 'interests',
        type: 'tags',
        question: 'What do you love talking about?',
        subtitle: 'Select 1 or more. We will personalize your vocabulary around these topics.',
        multiple: true,
    },
    {
        id: 'time_per_day',
        type: 'choice',
        question: 'How much time can you dedicate?',
        subtitle: "Be honest — consistency beats intensity every time.",
        options: [
            { value: '10_15', label: '10 – 15 min', icon: '⚡', desc: 'Quick daily sessions' },
            { value: '20_30', label: '20 – 30 min', icon: '☕', desc: 'Focused practice' },
            { value: '30_60', label: '30 – 60 min', icon: '🔥', desc: 'Deep learning sessions' },
            { value: '60_plus', label: '1 + hour', icon: '🚀', desc: 'Intensive training' },
        ],
    },
]

// ─── Label helpers ────────────────────────────────────────────────────────────

function labelFor(stepId: string, value: string | string[]): string {
    const step = STEPS.find(s => s.id === stepId)
    if (!step) return String(value)

    if (Array.isArray(value)) {
        return value.map(v => step.options?.find(o => o.value === v)?.label ?? v).join(', ')
    }

    return step.options?.find(o => o.value === value)?.label ?? String(value)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Onboarding({ user }: OnboardingProps) {
    const [step, setStep] = useState<number>(0)
    const [answers, setAnswers] = useState<Answers>({})
    const [selected, setSelected] = useState<string[]>([])
    const [submitting, setSubmitting] = useState<boolean>(false)

    // Estados para las burbujas dinámicas y texto personalizado
    const [baseBubbles, setBaseBubbles] = useState<string[]>([])       // Nivel 1 (Fijas)
    const [dynamicBubbles, setDynamicBubbles] = useState<string[]>([]) // Niveles profundos
    
    const [poppingBubbles, setPoppingBubbles] = useState<string[]>([])
    const [loadingBubbles, setLoadingBubbles] = useState<boolean>(false)
    const [customTag, setCustomTag] = useState<string>('')
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const currentStep = STEPS[step]
    const isLast = step === STEPS.length - 1

    useEffect(() => {
        fetchRelatedTopics('')
    }, [])

    async function fetchRelatedTopics(topic: string) {
        setLoadingBubbles(true)
        try {
            const response = await axios.get((window as any).route('onboarding.interests'), {
                params: { topic }
            })
            
            const similares: string[] = response.data.topics || []

            if (topic === '') {
                setBaseBubbles(similares)
            } else {
                setDynamicBubbles(similares)
            }
        } catch (error) {
            console.error("Error fetching AI topics", error)
        } finally {
            setLoadingBubbles(false)
        }
    }

    function selectOption(value: string) {
        if (currentStep.multiple) {
            setSelected(prev =>
                prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
            )
        } else {
            setSelected([value])
        }
    }

    function handleContinue() {
        if (selected.length === 0 || submitting) return

        const answerValue = currentStep.multiple ? selected : selected[0]

        const newAnswers: Answers = {
            ...answers,
            [currentStep.id]: answerValue,
        }

        setAnswers(newAnswers)

        if (isLast) {
            setSubmitting(true)
            router.post(
                (window as any).route('onboarding.store'),
                newAnswers,
                { preserveState: false }
            )
        } else {
            setStep(s => s + 1)
            setSelected([])
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && selected.length > 0 && !customTag) {
            handleContinue()
        }
    }

    function handleBubbleClick(item: string) {
        setPoppingBubbles(prev => [...prev, item])

        setTimeout(() => {
            setSelected(prev => prev.includes(item) ? prev : [...prev, item])
            setDynamicBubbles([])
            setPoppingBubbles(prev => prev.filter(b => b !== item))
        }, 300)

        if (debounceTimer.current) clearTimeout(debounceTimer.current)

        debounceTimer.current = setTimeout(() => {
            fetchRelatedTopics(item)
        }, 800)
    }

    function handleCustomTagSubmit() {
        if (!customTag.trim()) return
        
        const newTag = customTag.trim()
        
        setSelected(prev => prev.includes(newTag) ? prev : [...prev, newTag])
        setCustomTag('')
        setDynamicBubbles([])
        
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
        debounceTimer.current = setTimeout(() => {
            fetchRelatedTopics(newTag)
        }, 800)
    }

    return (
        <div className="ob-root" onKeyDown={handleKeyDown}>

            {/* ── Header ── */}
            <header className="ob-header">
                <div className="ob-logo">
                    <div className="ob-logo-dot" />
                    Capuchino
                </div>
                <span className="ob-header-label">Setup — {step + 1} of {STEPS.length}</span>
            </header>

            {/* ── Main ── */}
            <main className="ob-main">

                <div className="ob-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemax={STEPS.length}>
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`ob-dot ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
                            aria-label={`Step ${i + 1}`}
                        />
                    ))}
                </div>

                <div key={step} className="ob-step animate-fade-in">
                    <h1 className="ob-question">{currentStep.question}</h1>
                    <p className="ob-subtitle">{currentStep.subtitle}</p>

                    {/* ── RENDERIZADO CONDICIONAL ── */}
                    {currentStep.type === 'tags' ? (

                        <div className="ob-bubbles-ui">
                            
                            <div className="ob-bubbles-container min-h-[150px] flex flex-wrap gap-3 items-center justify-center">
                                
                                {/* MAGIA: Juntamos ambas listas y filtramos las que ya atrapó */}
                                {(() => {
                                    const allVisible = [...baseBubbles, ...dynamicBubbles].filter(b => !selected.includes(b));

                                    if (allVisible.length === 0 && !loadingBubbles) {
                                        return <p className="text-gray-400 italic">Type a topic below or click continue.</p>
                                    }

                                    return allVisible.map((bubble, index) => {
                                        const isPopping = poppingBubbles.includes(bubble)
                                        const delay = `${(index * 0.1)}s` 

                                        return (
                                            <div
                                                key={bubble}
                                                className={`bubble ${isPopping ? 'popping' : ''} animate-fade-in`}
                                                style={{ animationDelay: isPopping ? '0s' : delay }}
                                                onClick={() => handleBubbleClick(bubble)}
                                            >
                                                {bubble}
                                            </div>
                                        )
                                    })
                                })()}
                            </div>

                            {/* Indicador de carga sutil */}
                            {loadingBubbles && (
                                <div className="text-center text-sm text-purple-500 mt-2 font-medium animate-pulse">
                                    Finding related topics... ✨
                                </div>
                            )}

                            {/* Input para agregar temas manuales */}
                            <div className="flex justify-center items-center gap-2 mt-6 max-w-md mx-auto">
                                <input 
                                    type="text" 
                                    value={customTag}
                                    onChange={(e) => setCustomTag(e.target.value)}
                                    placeholder="Don't see it? Type your own..."
                                    className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleCustomTagSubmit()
                                        }
                                    }}
                                />
                                <button 
                                    onClick={handleCustomTagSubmit}
                                    disabled={!customTag.trim()}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                >
                                    Add
                                </button>
                            </div>

                            {/* INVENTARIO */}
                            {selected.length > 0 && (
                                <div className="ob-inventory mt-8 pt-6 border-t border-gray-100">
                                    <div className="ob-inventory-title font-semibold mb-3 text-gray-700 text-sm uppercase tracking-wide">
                                        Your Profile:
                                    </div>
                                    <div className="ob-tags-inventory flex flex-wrap gap-2">
                                        {selected.map(tag => (
                                            <span key={tag} className="ob-badge bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    ) : (

                        /* INTERFAZ DE TARJETAS */
                        <div className="ob-cards">
                            {currentStep.options?.map(opt => {
                                const isSelected = selected.includes(opt.value)

                                return (
                                    <div
                                        key={opt.value}
                                        className={`ob-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => selectOption(opt.value)}
                                        role="button"
                                        aria-pressed={isSelected}
                                        aria-label={opt.label}
                                        tabIndex={0}
                                        onKeyDown={e => e.key === ' ' && selectOption(opt.value)}
                                    >
                                        <span className="ob-card-icon" aria-hidden="true">{opt.icon}</span>
                                        <span className="ob-card-title">{opt.label}</span>
                                        <span className="ob-card-desc">{opt.desc}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Summary */}
                {isLast && Object.keys(answers).length > 0 && (
                    <div className="ob-summary mt-6" aria-label="Your selections so far">
                        {Object.entries(answers).map(([key, val]) => (
                            <div key={key} className="ob-summary-row flex justify-between py-2 border-b border-gray-100">
                                <span className="ob-summary-label font-medium text-gray-600">
                                    {STEPS.find(s => s.id === key)?.question}
                                </span>
                                <span className="ob-summary-value text-gray-900 text-right max-w-[50%]">
                                    {labelFor(key, val)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="ob-actions mt-8 flex flex-col items-center gap-3">
                    <button
                        className="ob-continue-btn bg-black text-white px-8 py-3 rounded-lg font-semibold w-full md:w-auto disabled:opacity-50 transition-opacity"
                        onClick={handleContinue}
                        disabled={selected.length === 0 || submitting}
                    >
                        {submitting
                            ? 'Setting up your plan...'
                            : isLast
                                ? `Start your assessment, ${user.name} →`
                                : 'Continue'}
                    </button>

                    <p className="ob-step-hint text-sm text-gray-400">
                        {selected.length > 0 ? 'Press Enter to continue' : 'Select an option to continue'}
                    </p>
                </div>

            </main>
        </div>
    )
}