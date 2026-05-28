import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Clock } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Lessons', href: '/lessons' },
];

const lessons = [
    { id: 1, title: 'Everyday Greetings', level: 'a1', duration: '10 min', emoji: '👋', description: 'Learn how to say hello, goodbye, and introduce yourself.', done: true },
    { id: 2, title: 'Present Simple Tense', level: 'a1', duration: '15 min', emoji: '📅', description: 'Use the present simple to talk about habits and facts.', done: true },
    { id: 3, title: 'Talking About Family', level: 'a1', duration: '12 min', emoji: '👨‍👩‍👧', description: 'Vocabulary and phrases to describe your family.', done: true },
    { id: 4, title: 'Food & Restaurants', level: 'a2', duration: '14 min', emoji: '🍽️', description: 'Order food and talk about what you like to eat.', done: false },
    { id: 5, title: 'Past Simple vs Past Continuous', level: 'b1', duration: '20 min', emoji: '⏳', description: 'Tell stories and describe past events naturally.', done: false },
    { id: 6, title: 'Expressing Opinions', level: 'b1', duration: '18 min', emoji: '💬', description: 'Share your views politely in conversations.', done: false },
];

export default function LessonsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lessons" />

            <div style={{ padding: 'var(--s-6)', maxWidth: 900, margin: '0 auto' }}>

                <div style={{ marginBottom: 'var(--s-7)' }}>
                    <p className="eyebrow" style={{ marginBottom: 'var(--s-2)' }}>Your learning path</p>
                    <h1 className="h2">Lessons</h1>
                    <p className="lede" style={{ fontSize: 'var(--fs-16)', marginTop: 'var(--s-2)' }}>
                        Structured lessons to guide you from beginner to fluent.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                    {lessons.map((lesson) => (
                        <div key={lesson.id} className="lesson-card" style={{ flexDirection: 'row', overflow: 'visible' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 'var(--r-md)',
                                background: 'var(--bg-sunken)', display: 'grid', placeItems: 'center',
                                fontSize: 28, flexShrink: 0, margin: 'var(--s-4)',
                            }}>
                                {lesson.emoji}
                            </div>
                            <div style={{ flex: 1, padding: 'var(--s-4) var(--s-4) var(--s-4) 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--s-1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
                                    <span className={`level ${lesson.level}`}>{lesson.level.toUpperCase()}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-subtle)', fontSize: 'var(--fs-12)', fontFamily: 'var(--font-mono)' }}>
                                        <Clock size={12} />
                                        {lesson.duration}
                                    </span>
                                    {lesson.done && <span className="badge soft-success">Completed</span>}
                                </div>
                                <p style={{ fontWeight: 600, margin: 0, fontSize: 'var(--fs-16)', color: 'var(--ink)' }}>{lesson.title}</p>
                                <p className="small" style={{ margin: 0 }}>{lesson.description}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--s-4)', flexShrink: 0 }}>
                                {lesson.done ? (
                                    <Link href="#" className="btn btn-sm btn-secondary">Review</Link>
                                ) : (
                                    <Link href="#" className="btn btn-sm btn-primary">
                                        <BookOpen size={14} />
                                        Start
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </AppLayout>
    );
}
