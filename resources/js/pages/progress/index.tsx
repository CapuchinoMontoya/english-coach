import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { BarChart2, BookOpen, Layers, Library, Sparkles } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Progress', href: '/progress' },
];

const stats = [
    { icon: BookOpen, label: 'Lessons done', value: 3, total: 24, pct: 13, color: 'var(--lvl-b1)' },
    { icon: Library, label: 'Words mastered', value: 47, total: 200, pct: 24, color: 'var(--accent)' },
    { icon: Layers, label: 'Cards reviewed', value: 120, total: 500, pct: 24, color: 'var(--lvl-c1)' },
    { icon: Sparkles, label: 'Grammar topics', value: 3, total: 11, pct: 27, color: 'var(--primary)' },
];

const activity = [
    { day: 'Mon', mins: 15 },
    { day: 'Tue', mins: 22 },
    { day: 'Wed', mins: 8 },
    { day: 'Thu', mins: 30 },
    { day: 'Fri', mins: 18 },
    { day: 'Sat', mins: 0 },
    { day: 'Sun', mins: 25 },
];

const maxMins = Math.max(...activity.map(d => d.mins), 1);

export default function ProgressIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Progress" />

            <div style={{ padding: 'var(--s-6)', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--s-8)' }}>

                <div>
                    <p className="eyebrow" style={{ marginBottom: 'var(--s-2)' }}>How you're doing</p>
                    <h1 className="h2">Progress</h1>
                    <p className="lede" style={{ fontSize: 'var(--fs-16)', marginTop: 'var(--s-2)' }}>
                        A snapshot of everything you've accomplished.
                    </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-2" style={{ gap: 'var(--s-4)' }}>
                    {stats.map((stat) => (
                        <div key={stat.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 'var(--r-sm)',
                                    background: stat.color, display: 'grid', placeItems: 'center',
                                    color: 'white', flexShrink: 0,
                                }}>
                                    <stat.icon size={16} />
                                </div>
                                <span className="small" style={{ color: 'var(--ink-muted)' }}>{stat.label}</span>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s-2)' }}>
                                    <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'var(--fs-32)', lineHeight: 1, color: 'var(--ink)' }}>
                                        {stat.value}
                                    </span>
                                    <span className="small mono" style={{ alignSelf: 'flex-end', color: 'var(--ink-subtle)' }}>/ {stat.total}</span>
                                </div>
                                <div className="progress">
                                    <div className="bar" style={{ width: `${stat.pct}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Weekly activity */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginBottom: 'var(--s-6)' }}>
                        <BarChart2 size={18} style={{ color: 'var(--ink-muted)' }} />
                        <p className="eyebrow" style={{ margin: 0 }}>This week's activity</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--s-3)', height: 100 }}>
                        {activity.map((d) => (
                            <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s-2)', height: '100%', justifyContent: 'flex-end' }}>
                                <span className="micro">{d.mins > 0 ? `${d.mins}m` : ''}</span>
                                <div style={{
                                    width: '100%',
                                    height: `${(d.mins / maxMins) * 72}px`,
                                    minHeight: d.mins > 0 ? 6 : 0,
                                    background: d.mins > 0 ? 'linear-gradient(180deg, var(--accent), var(--primary))' : 'var(--bg-sunken)',
                                    borderRadius: 'var(--r-sm) var(--r-sm) 0 0',
                                    transition: 'height 0.4s var(--ease-out)',
                                }} />
                                <span className="micro">{d.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <Link href="/streak" className="btn btn-secondary">
                        View streak details
                    </Link>
                </div>

            </div>
        </AppLayout>
    );
}
