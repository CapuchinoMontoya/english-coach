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
    const [currentSubOptions, setCurrentSubOptions] = useState<{ name: string, turns: number }[]>([]);
    const [poppingBubbles, setPoppingBubbles] = useState<string[]>([])
    const [customTag, setCustomTag] = useState<string>('')
    const [activeCategory, setActiveCategory] = useState<string>('');

    const currentStep = STEPS[step]
    const isLast = step === STEPS.length - 1

    const rootCategories = ['Music', 'Movies & TV', 'Video Games', 'Sports & Fitness', 'Food & Cooking'];
    const genreCategories = [
        // Movies & TV
        'Action', 'Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Documentaries',
        // Video Games
        'RPG', 'Shooter', 'Adventure', 'Strategy', 'Puzzle', 'Sports',
        // Music
        'Rock', 'Pop', 'Rap & Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'Latin',
        // Sports & Fitness
        'Football', 'Basketball', 'Tennis', 'Baseball', 'Cycling', 'Running',
        // Food & Cooking
        'Chicken', 'Seafood', 'Beef', 'Pasta', 'Vegetarian', 'Dessert', 'Breakfast', 'Vegan',
    ];

    const rootCategoryIcons: Record<string, string> = {
        'Music':           '🎵',
        'Movies & TV':     '🎬',
        'Video Games':     '🎮',
        'Sports & Fitness':'⚽',
        'Food & Cooking':  '🍳',
    };

    function isLevel3(name: string) {
        return !rootCategories.includes(name) && !genreCategories.includes(name);
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

    async function handleBubbleClick(item: string) {
        setPoppingBubbles(prev => [...prev, item]);

        // Actualizar contexto si es categoría raíz
        let categoryContext = activeCategory;
        if (rootCategories.includes(item)) {
            categoryContext = item;
            setActiveCategory(item);
        }

        try {
            const response = await axios.get((window as any).route('onboarding.interests'), {
                params: { topic: item, category: categoryContext }
            });

            const nuevasRecomendaciones = (response.data.topics || []).map((name: string) => ({ name, turns: 0 }));

            setCurrentSubOptions(prev => {
                const MAX_SUBS = 12;

                // 1. Aumentar turnos a Nivel 3 existentes
                let updated = prev.map(b => ({
                    ...b,
                    turns: isLevel3(b.name) ? b.turns + 1 : b.turns
                }));

                // 2. Borrar Nivel 3 que cumplieron 3 turnos
                updated = updated.filter(b => !(isLevel3(b.name) && b.turns >= 3));

                // 3. Añadir solo las realmente nuevas (preserva turn counts existentes)
                const existingNames = new Set(updated.map(b => b.name));
                const trulyNew = nuevasRecomendaciones.filter((r: { name: string; turns: number }) => !existingNames.has(r.name));
                let result = [...updated, ...trulyNew];

                // 4. Si se pasa del límite, quitar las más viejas (mayor turns) primero
                if (result.length > MAX_SUBS) {
                    result.sort((a, b) => b.turns - a.turns);
                    result = result.slice(result.length - MAX_SUBS);
                }

                return result;
            });

            setSelected(prev => prev.includes(item) ? prev : [...prev, item]);
        } catch (error) {
            console.error("Error", error);
        }

        setPoppingBubbles(prev => prev.filter(b => b !== item));
    }

    function handleCustomTagSubmit() {
        if (!customTag.trim()) return

        const newTag = customTag.trim()
        setSelected(prev => prev.includes(newTag) ? prev : [...prev, newTag])
        setCustomTag('')

        // Opcional: Podrías buscar en el árbol si el custom tag casualmente coincide 
        // con alguna llave, pero generalmente los tags custom son nodos finales.
    }

    const allVisibleBubbles = [
        ...rootCategories
            .filter(c => !selected.includes(c))
            .map(name => ({ name, isRoot: true })),
        ...currentSubOptions
            .filter(c => !selected.includes(c.name))
            .map(c => ({ name: c.name, isRoot: false })),
    ];

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

                            <div className="ob-bubbles-container">
                                {allVisibleBubbles.length === 0 ? (
                                    <p className="ob-bubbles-empty">Type a topic below or click continue.</p>
                                ) : (
                                    allVisibleBubbles.map((bubble, index) => (
                                        <div
                                            key={bubble.name}
                                            className={`bubble ${poppingBubbles.includes(bubble.name) ? 'popping' : ''} ${bubble.isRoot ? 'bubble-root' : ''}`}
                                            style={{ animationDelay: poppingBubbles.includes(bubble.name) ? '0s' : `${index * 0.05}s` }}
                                            onClick={() => handleBubbleClick(bubble.name)}
                                        >
                                            {bubble.isRoot && rootCategoryIcons[bubble.name] && (
                                                <span className="bubble-icon">{rootCategoryIcons[bubble.name]}</span>
                                            )}
                                            {bubble.name}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input para agregar temas manuales */}
                            <div className="ob-custom-row">
                                <input
                                    type="text"
                                    value={customTag}
                                    onChange={(e) => setCustomTag(e.target.value)}
                                    placeholder="Don't see it? Type your own…"
                                    className="ob-custom-input"
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
                                    className="ob-custom-btn"
                                >
                                    Add
                                </button>
                            </div>

                            {/* INVENTARIO */}
                            {selected.length > 0 && (
                                <div className="ob-inventory">
                                    <span className="ob-inventory-title">Your interests</span>
                                    <div className="ob-tags-inventory">
                                        {selected.map(tag => (
                                            <span key={tag} className="ob-badge">
                                                {rootCategoryIcons[tag] && <span className="ob-badge-icon">{rootCategoryIcons[tag]}</span>}
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