import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import './onboarding.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Option {
    value: string
    label: string
    icon:  string
    desc:  string
}

interface Step {
    id:       string
    question: string
    subtitle: string
    options:  Option[]
}

interface Answers {
    age_group?:      string
    goal?:           string
    learning_style?: string
    time_per_day?:   string
}

interface User {
    id:   number
    name: string
}

interface OnboardingProps {
    user: User
}

// ─── Steps data ───────────────────────────────────────────────────────────────

const STEPS: Step[] = [
    {
        id:       'age_group',
        question: 'How old are you?',
        subtitle: "We'll tailor topics and cultural references to what's most relevant for you.",
        options:  [
            { value: 'under_18', label: 'Under 18',  icon: '🎒', desc: 'Student life'      },
            { value: '18_25',    label: '18 – 25',   icon: '🎓', desc: 'Young adult'       },
            { value: '26_35',    label: '26 – 35',   icon: '💼', desc: 'Professional'      },
            { value: '36_plus',  label: '36 +',      icon: '🌟', desc: 'Experienced'       },
        ],
    },
    {
        id:       'goal',
        question: "What's your main goal?",
        subtitle: 'Your entire plan will be focused around what matters most to you.',
        options:  [
            { value: 'work',    label: 'Work & Career',   icon: '💼', desc: 'Emails, meetings, presentations'  },
            { value: 'travel',  label: 'Travel',          icon: '✈️', desc: 'Conversations, navigation, culture' },
            { value: 'school',  label: 'School & Exams',  icon: '📚', desc: 'Academic English, TOEFL, IELTS'   },
            { value: 'general', label: 'General fluency', icon: '🌍', desc: 'Overall improvement'              },
        ],
    },
    {
        id:       'learning_style',
        question: 'How do you learn best?',
        subtitle: 'Alex will adapt every session to what actually clicks for you.',
        options:  [
            { value: 'conversational',  label: 'Talking',          icon: '💬', desc: 'Learn through real conversation'  },
            { value: 'reading_writing', label: 'Reading & Writing', icon: '📝', desc: 'Texts, grammar, writing practice' },
            { value: 'visual',          label: 'Visual examples',   icon: '👁️', desc: 'Context, examples, diagrams'       },
            { value: 'exercises',       label: 'Practice',          icon: '✏️', desc: 'Exercises and repetition'         },
        ],
    },
    {
        id:       'time_per_day',
        question: 'How much time can you dedicate?',
        subtitle: "Be honest — consistency beats intensity every time.",
        options:  [
            { value: '10_15',   label: '10 – 15 min', icon: '⚡', desc: 'Quick daily sessions'    },
            { value: '20_30',   label: '20 – 30 min', icon: '☕', desc: 'Focused practice'        },
            { value: '30_60',   label: '30 – 60 min', icon: '🔥', desc: 'Deep learning sessions'  },
            { value: '60_plus', label: '1 + hour',    icon: '🚀', desc: 'Intensive training'       },
        ],
    },
]

// ─── Label helpers (for the summary) ─────────────────────────────────────────

function labelFor(stepId: string, value: string): string {
    const step = STEPS.find(s => s.id === stepId)
    return step?.options.find(o => o.value === value)?.label ?? value
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Onboarding({ user }: OnboardingProps) {
    const [step, setStep]         = useState<number>(0)
    const [answers, setAnswers]   = useState<Answers>({})
    const [selected, setSelected] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState<boolean>(false)

    const currentStep = STEPS[step]
    const isLast      = step === STEPS.length - 1

    function selectOption(value: string) {
        setSelected(value)
    }

    function handleContinue() {
        if (!selected || submitting) return

        const newAnswers: Answers = {
            ...answers,
            [currentStep.id]: selected,
        }

        setAnswers(newAnswers)

        if (isLast) {
            setSubmitting(true)
            router.post(
                (window as any).route('onboarding.store'),
                newAnswers as Record<string, string>,
                { preserveState: false }
            )
        } else {
            setStep(s => s + 1)
            setSelected(null)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && selected) handleContinue()
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

                {/* Progress dots */}
                <div className="ob-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemax={STEPS.length}>
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`ob-dot ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
                            aria-label={`Step ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Step — key forces re-mount for animation */}
                <div key={step} className="ob-step">
                    <h1 className="ob-question">{currentStep.question}</h1>
                    <p className="ob-subtitle">{currentStep.subtitle}</p>

                    <div className="ob-cards">
                        {currentStep.options.map(opt => (
                            <div
                                key={opt.value}
                                className={`ob-card ${selected === opt.value ? 'selected' : ''}`}
                                onClick={() => selectOption(opt.value)}
                                role="button"
                                aria-pressed={selected === opt.value}
                                aria-label={opt.label}
                                tabIndex={0}
                                onKeyDown={e => e.key === ' ' && selectOption(opt.value)}
                            >
                                <span className="ob-card-icon" aria-hidden="true">{opt.icon}</span>
                                <span className="ob-card-title">{opt.label}</span>
                                <span className="ob-card-desc">{opt.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary en el último paso */}
                {isLast && Object.keys(answers).length > 0 && (
                    <div className="ob-summary" aria-label="Your selections so far">
                        {(Object.entries(answers) as [keyof Answers, string][]).map(([key, val]) => (
                            <div key={key} className="ob-summary-row">
                                <span className="ob-summary-label">
                                    {STEPS.find(s => s.id === key)?.question}
                                </span>
                                <span className="ob-summary-value">{labelFor(key, val)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="ob-actions">
                    <button
                        className="ob-continue-btn"
                        onClick={handleContinue}
                        disabled={!selected || submitting}
                    >
                        {submitting
                            ? 'Setting up your plan...'
                            : isLast
                                ? `Start your assessment, ${user.name} →`
                                : 'Continue'}
                    </button>

                    <p className="ob-step-hint">
                        {selected ? 'Press Enter to continue' : 'Select an option to continue'}
                    </p>
                </div>

            </main>
        </div>
    )
}
