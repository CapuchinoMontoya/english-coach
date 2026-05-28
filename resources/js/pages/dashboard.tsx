import AppLayout from '@/layouts/app-layout';
import { type SharedData, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, Flame, Layers, Library, Sparkles, TrendingUp } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const wordOfTheDay = {
    word: 'serendipity',
    pron: '/ˌserənˈdipɪti/',
    pos: 'noun',
    definition: 'The occurrence of events by chance in a happy or beneficial way.',
    example: '"A fortunate stroke of serendipity brought them together."',
};

const quickActions = [
    {
        icon: BookOpen,
        label: 'Lessons',
        description: 'Continue your structured learning path',
        href: '/lessons',
        color: 'var(--lvl-b1)',
    },
    {
        icon: Library,
        label: 'Vocabulary',
        description: 'Build and review your word bank',
        href: '/vocabulary',
        color: 'var(--accent)',
    },
    {
        icon: Layers,
        label: 'Flashcards',
        description: 'Practice with spaced repetition',
        href: '/flashcards',
        color: 'var(--lvl-c1)',
    },
    {
        icon: Sparkles,
        label: 'Grammar',
        description: 'Master English grammar rules',
        href: '/grammar',
        color: 'var(--primary)',
    },
];

const progressItems = [
    { label: 'Lessons completed', value: 3, total: 24, pct: 13 },
    { label: 'Vocabulary mastered', value: 47, total: 200, pct: 24 },
    { label: 'Flashcards reviewed', value: 120, total: 500, pct: 24 },
];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user.name.split(' ')[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div style={{ padding: 'var(--s-6)', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--s-7)' }}>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s-4)' }}>
                    <div>
                        <p className="eyebrow" style={{ marginBottom: 'var(--s-2)' }}>{greeting}</p>
                        <h1 className="h2" style={{ margin: 0 }}>{firstName} 👋</h1>
                        <p className="lede" style={{ marginTop: 'var(--s-2)', fontSize: 'var(--fs-16)' }}>
                            Ready to practice your English today?
                        </p>
                    </div>
                    <div className="streak">
                        <span className="flame">
                            <Flame size={18} />
                        </span>
                        <span>5-day streak</span>
                    </div>
                </div>

                {/* Word of the day */}
                <div className="flashcard" style={{ textAlign: 'left', flexDirection: 'row', flexWrap: 'wrap', gap: 'var(--s-6)', alignItems: 'center', minHeight: 'auto', padding: 'var(--s-6)' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <p className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>Word of the day</p>
                        <div className="word" style={{ fontSize: 'var(--fs-48)' }}>{wordOfTheDay.word}</div>
                        <div style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'center', marginTop: 'var(--s-2)' }}>
                            <span className="pron">{wordOfTheDay.pron}</span>
                            <span className="pos badge">{wordOfTheDay.pos}</span>
                        </div>
                    </div>
                    <div style={{ flex: 2, minWidth: 240 }}>
                        <p className="body" style={{ marginBottom: 'var(--s-2)' }}>{wordOfTheDay.definition}</p>
                        <p className="small italic" style={{ color: 'var(--ink-subtle)' }}>{wordOfTheDay.example}</p>
                        <div style={{ marginTop: 'var(--s-4)' }}>
                            <Link href="/vocabulary" className="btn btn-sm btn-secondary">
                                See more words
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick actions */}
                <div>
                    <p className="eyebrow" style={{ marginBottom: 'var(--s-4)' }}>Jump back in</p>
                    <div className="grid grid-2" style={{ gap: 'var(--s-4)' }}>
                        {quickActions.map((action) => (
                            <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
                                <div className="card card-hover" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 'var(--s-4)' }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 'var(--r-md)',
                                        background: action.color, display: 'grid', placeItems: 'center',
                                        flexShrink: 0, color: 'white',
                                    }}>
                                        <action.icon size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, margin: 0, fontSize: 'var(--fs-15)', color: 'var(--ink)' }}>{action.label}</p>
                                        <p className="small" style={{ margin: 0, marginTop: 2 }}>{action.description}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Progress overview */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
                            <TrendingUp size={18} style={{ color: 'var(--ink-muted)' }} />
                            <p className="eyebrow" style={{ margin: 0 }}>Your progress</p>
                        </div>
                        <Link href="/progress" className="btn btn-ghost btn-sm" style={{ fontSize: 'var(--fs-13)' }}>
                            View all
                        </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
                        {progressItems.map((item) => (
                            <div key={item.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s-2)' }}>
                                    <span className="small" style={{ color: 'var(--ink)' }}>{item.label}</span>
                                    <span className="small mono">{item.value} / {item.total}</span>
                                </div>
                                <div className="progress">
                                    <div className="bar" style={{ width: `${item.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
