import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import { CheckCircle, Clock, Lock, RotateCcw } from 'lucide-react'
import '../lessons.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type TopicStatus = 'pending' | 'in_progress' | 'completed' | 'needs_review'

interface Topic {
    id:           number
    order:        number
    title:        string
    description:  string
    status:       TopicStatus
    score:        number | null
    locked:       boolean
}

interface LessonsIndexProps {
    topics:     Topic[]
    transition: string    // "A2_to_B1"
    level:      string    // "A2"
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Lessons',   href: '/lessons'   },
]

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<TopicStatus, string> = {
    pending:      'Pending',
    in_progress:  'In Progress',
    completed:    'Completed',
    needs_review: 'Needs Review',
}

const STATUS_CTA: Record<TopicStatus, string> = {
    pending:      'Start',
    in_progress:  'Continue',
    completed:    'Review',
    needs_review: 'Retry',
}

function StatusIcon({ status }: { status: TopicStatus }) {
    if (status === 'completed')    return <CheckCircle size={14} style={{ color: '#2E7D32' }} />
    if (status === 'needs_review') return <RotateCcw   size={14} style={{ color: '#F57F17' }} />
    if (status === 'in_progress')  return <Clock       size={14} style={{ color: '#E65100' }} />
    return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LessonsIndex({ topics, transition, level }: LessonsIndexProps) {
    const transitionLabel = transition.replace('_to_', ' → ')

    function handleStart(topic: Topic) {
        if (topic.locked) return
        router.get(`/lessons/${topic.id}`)
    }

    const completed = topics.filter(t => t.status === 'completed').length
    const total     = topics.length

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lessons" />

            <div style={{ padding: '24px', maxWidth: 780, margin: '0 auto' }}>

                {/* Header */}
                <div className="ls-header">
                    <div>
                        <div className="ls-level-badge">
                            {transitionLabel}
                        </div>
                        <h1 style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontStyle: 'italic',
                            fontSize: 28,
                            color: '#6B3F1F',
                            margin: '0 0 4px',
                        }}>
                            Your learning plan
                        </h1>
                        <p style={{ fontSize: 13, color: '#A08070', margin: 0 }}>
                            {completed} of {total} topics completed
                        </p>
                    </div>

                    {/* Progress ring — simple bar */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            fontSize: 28,
                            fontWeight: 500,
                            fontFamily: "'Cormorant Garamond', serif",
                            color: '#6B3F1F',
                        }}>
                            {total > 0 ? Math.round((completed / total) * 100) : 0}%
                        </div>
                        <p style={{ fontSize: 11, color: '#A08070', margin: 0 }}>complete</p>
                    </div>
                </div>

                {/* Topic list */}
                <div className="ls-topics">
                    {topics.map(topic => (
                        <div
                            key={topic.id}
                            className={`ls-topic-card ${topic.status} ${topic.locked ? 'locked' : ''}`}
                            onClick={() => handleStart(topic)}
                            role={topic.locked ? 'listitem' : 'button'}
                            tabIndex={topic.locked ? -1 : 0}
                            onKeyDown={e => e.key === 'Enter' && handleStart(topic)}
                        >
                            {/* Order number */}
                            <div className="ls-topic-num">
                                {topic.status === 'completed'
                                    ? '✓'
                                    : topic.locked
                                        ? <Lock size={13} />
                                        : topic.order
                                }
                            </div>

                            {/* Content */}
                            <div className="ls-topic-body">
                                <div className="ls-topic-title">{topic.title}</div>
                                <div className="ls-topic-desc">{topic.description}</div>
                            </div>

                            {/* Meta + CTA */}
                            <div className="ls-topic-meta">
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        justifyContent: 'flex-end',
                                        marginBottom: 4,
                                    }}>
                                        <StatusIcon status={topic.status} />
                                        <span className={`ls-status-badge ${topic.status}`}>
                                            {STATUS_LABEL[topic.status]}
                                        </span>
                                    </div>
                                    {topic.score !== null && (
                                        <div className="ls-score">{topic.score}/100</div>
                                    )}
                                </div>

                                {!topic.locked && (
                                    <button
                                        className={`ls-start-btn ${topic.status === 'completed' ? 'secondary' : ''}`}
                                        onClick={e => { e.stopPropagation(); handleStart(topic) }}
                                    >
                                        {STATUS_CTA[topic.status]}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    )
}
