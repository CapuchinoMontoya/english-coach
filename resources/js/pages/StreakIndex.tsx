import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Flame, CalendarDays, Zap } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Streak', href: '/streak' },
];

interface StreakIndexProps {
    currentStreak: number;
    longestStreak: number;
    last30: boolean[];
}

export default function StreakIndex({ currentStreak, longestStreak, last30 = [] }: StreakIndexProps) {
    // Calculamos cuántos días de los últimos 30 ha practicado
    const daysPracticed = last30.filter(Boolean).length;
    const consistency = Math.round((daysPracticed / 30) * 100);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Streak" />

            {/* Contenedor principal: Más ancho y sin scroll */}
            <div style={{ 
                padding: 'var(--s-6)', 
                maxWidth: 1000, // Aumentamos el ancho máximo
                margin: '0 auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'var(--s-6)',
                height: '100%' 
            }}>

                {/* Header (Mantenemos la introducción arriba) */}
                <div>
                    <p className="eyebrow" style={{ marginBottom: 'var(--s-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={16} color="var(--lvl-b2)" /> Daily habit
                    </p>
                    <h1 className="h2">Your Learning Streak</h1>
                    <p className="lede" style={{ fontSize: 'var(--fs-16)', marginTop: 'var(--s-2)', color: 'var(--ink-light)' }}>
                        Consistency is the key to fluency. Keep the fire burning.
                    </p>
                </div>

                {/* Layout a dos columnas */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                    gap: 'var(--s-6)',
                    alignItems: 'start'
                }}>

                    {/* COLUMNA IZQUIERDA: Hero streak counter */}
                    <div className="card" style={{ 
                        textAlign: 'center', 
                        padding: 'var(--s-10) var(--s-6)', 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        borderTop: '4px solid var(--lvl-b2)'
                    }}>
                        <div style={{
                            width: 100, height: 100, borderRadius: '50%',
                            background: currentStreak > 0 ? 'linear-gradient(135deg, var(--lvl-a2), var(--lvl-b2))' : 'var(--bg-sunken)',
                            display: 'grid', placeItems: 'center',
                            margin: '0 auto var(--s-5)',
                            boxShadow: currentStreak > 0 ? '0 12px 32px oklch(from var(--lvl-b2) l c h / 0.4)' : 'none',
                            transition: 'all 0.3s ease'
                        }}>
                            <Flame size={48} color={currentStreak > 0 ? "white" : "var(--ink-light)"} />
                        </div>
                        
                        <div style={{ 
                            fontFamily: 'var(--font-display)', 
                            fontStyle: 'italic', 
                            fontSize: 'var(--fs-80)', 
                            lineHeight: 1, 
                            color: 'var(--ink)',
                            marginBottom: 'var(--s-2)'
                        }}>
                            {currentStreak}
                        </div>
                        <p className="lede" style={{ fontSize: 'var(--fs-20)', fontWeight: 600 }}>
                            {currentStreak === 1 ? 'day streak' : 'days streak'}
                        </p>
                        
                        <div style={{ 
                            marginTop: 'var(--s-6)', 
                            padding: 'var(--s-3)', 
                            background: 'var(--bg-sunken)', 
                            borderRadius: 'var(--r-md)',
                            display: 'inline-block'
                        }}>
                            <p className="small" style={{ margin: 0 }}>
                                🏆 Your longest streak: <strong>{longestStreak} days</strong>
                            </p>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Calendario y Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
                        
                        {/* Calendar heatmap */}
                        <div className="card" style={{ padding: 'var(--s-6)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s-5)' }}>
                                <p className="eyebrow" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CalendarDays size={16} /> Last 30 days
                                </p>
                                <span className="micro" style={{ background: 'var(--bg-sunken)', padding: '4px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                    {consistency}% Consistency
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--s-2)' }}>
                                {last30.map((active, i) => (
                                    <div
                                        key={i}
                                        title={active ? "Practiced" : "Skipped"}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: 'var(--r-sm)',
                                            background: active
                                                ? 'linear-gradient(135deg, var(--lvl-a2), var(--lvl-b2))'
                                                : 'var(--bg-sunken)',
                                            opacity: active ? 1 : 0.6,
                                            transition: 'transform 0.2s, opacity 0.2s',
                                            cursor: 'default',
                                        }}
                                        onMouseEnter={(e) => active && (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={(e) => active && (e.currentTarget.style.transform = 'scale(1)')}
                                    />
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--s-3)', marginTop: 'var(--s-5)', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <span className="micro" style={{ color: 'var(--ink-light)' }}>Missed</span>
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-sunken)' }} />
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg, var(--lvl-a2), var(--lvl-b2))' }} />
                                <span className="micro" style={{ color: 'var(--ink-light)' }}>Practiced</span>
                            </div>
                        </div>

                        {/* Motivational tip */}
                        <div className="alert info" style={{ display: 'flex', alignItems: 'flex-start', borderLeft: '4px solid var(--info)' }}>
                            <div className="icon" style={{ marginTop: '2px' }}>
                                <Flame size={20} />
                            </div>
                            <div className="body">
                                <p className="title" style={{ fontSize: 'var(--fs-16)', marginBottom: '4px' }}>
                                    {currentStreak === 0 
                                        ? "Time to light the fire!" 
                                        : "Keep the momentum going!"}
                                </p>
                                <p className="text" style={{ fontSize: 'var(--fs-14)', margin: 0 }}>
                                    {currentStreak === 0 
                                        ? "Start a new session today to begin your streak. Every expert was once a beginner."
                                        : "Practice for just 10 minutes today to maintain your streak. Short, daily sessions build long-term memory."}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}