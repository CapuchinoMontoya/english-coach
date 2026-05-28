import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Flame } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Streak', href: '/streak' },
];

const currentStreak = 5;
const longestStreak = 12;

// Last 30 days (true = practiced, false = skipped)
const last30 = [
    true, true, false, true, true, true, false,
    true, true, true, true, false, true, true,
    false, false, true, true, true, true, true,
    false, true, false, true, true, true, true,
    true, true,
];

export default function StreakIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Streak" />

            <div style={{ padding: 'var(--s-6)', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--s-8)' }}>

                <div>
                    <p className="eyebrow" style={{ marginBottom: 'var(--s-2)' }}>Daily habit</p>
                    <h1 className="h2">Streak</h1>
                    <p className="lede" style={{ fontSize: 'var(--fs-16)', marginTop: 'var(--s-2)' }}>
                        Consistency is the key to fluency.
                    </p>
                </div>

                {/* Hero streak counter */}
                <div className="card" style={{ textAlign: 'center', padding: 'var(--s-9)' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--lvl-a2), var(--lvl-b2))',
                        display: 'grid', placeItems: 'center',
                        margin: '0 auto var(--s-5)',
                        boxShadow: '0 8px 24px oklch(from var(--lvl-b2) l c h / 0.35)',
                    }}>
                        <Flame size={36} color="white" />
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'var(--fs-64)', lineHeight: 1, color: 'var(--ink)' }}>
                        {currentStreak}
                    </div>
                    <p className="lede" style={{ fontSize: 'var(--fs-18)', marginTop: 'var(--s-2)' }}>day streak</p>
                    <p className="small" style={{ marginTop: 'var(--s-3)' }}>
                        Your longest streak: <strong>{longestStreak} days</strong>
                    </p>
                </div>

                {/* Calendar heatmap */}
                <div className="card">
                    <p className="eyebrow" style={{ marginBottom: 'var(--s-5)' }}>Last 30 days</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--s-2)' }}>
                        {last30.map((active, i) => (
                            <div
                                key={i}
                                style={{
                                    aspectRatio: '1',
                                    borderRadius: 'var(--r-sm)',
                                    background: active
                                        ? 'linear-gradient(135deg, var(--lvl-a2), var(--lvl-b2))'
                                        : 'var(--bg-sunken)',
                                    transition: 'background 0.2s',
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--s-3)', marginTop: 'var(--s-4)', alignItems: 'center' }}>
                        <span className="micro">Less</span>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--bg-sunken)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: 'linear-gradient(135deg, var(--lvl-a2), var(--lvl-b2))' }} />
                        <span className="micro">More</span>
                    </div>
                </div>

                {/* Motivational tip */}
                <div className="alert info">
                    <div className="icon">
                        <Flame size={20} />
                    </div>
                    <div className="body">
                        <p className="title">Keep it going!</p>
                        <p className="text">Practice for just 10 minutes today to maintain your streak. Short sessions are better than no sessions.</p>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
