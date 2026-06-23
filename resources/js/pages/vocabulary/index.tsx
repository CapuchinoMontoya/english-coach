import { useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, Link } from '@inertiajs/react'
import { Sparkles, RotateCcw, Check, Search, Filter, CheckCircle2 } from 'lucide-react'
import './vocabulary.css'

interface Theme {
    theme: string
    level: string
    total: number
    mastered: number
    learning: number
    new: number
}

interface PageProps {
    themes: Theme[] 
    dueCount: number
    level: string | null
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default function VocabularyIndex({ themes = [], dueCount = 0, level = null }: PageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Vocabulary', href: '#' },
    ]

    // ── Estados Locales para Filtros ──
    const [search, setSearch] = useState('')
    const [selectedLevel, setSelectedLevel] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('') // '' = todos, 'completed' = dominados, 'pending' = pendientes

    // ── Filtrado Local ──
    const filteredThemes = themes.filter(t => {
        // 1. Filtro de búsqueda
        const matchesSearch = t.theme.toLowerCase().includes(search.toLowerCase())
        
        // 2. Filtro de Nivel
        const matchesLevel = selectedLevel === '' || t.level === selectedLevel
        
        // 3. Filtro de Estado
        const isComplete = t.total > 0 && t.mastered === t.total
        let matchesStatus = true
        if (selectedStatus === 'completed') matchesStatus = isComplete
        if (selectedStatus === 'pending') matchesStatus = !isComplete

        return matchesSearch && matchesLevel && matchesStatus
    })

    // Agrupamos los temas YA FILTRADOS por nivel
    const byLevel = LEVEL_ORDER
        .map(l => ({ level: l, themes: filteredThemes.filter(t => t.level === l) }))
        .filter(g => g.themes.length > 0)

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vocabulary" />

            <div className="vb">
                <div className="vb-head">
                    <div className="vb-title">Vocabulary</div>
                    <div className="vb-sub">
                        {level ? `Tu nivel: ${level} · ` : ''} 
                        {themes.length} temas desbloqueados
                    </div>
                </div>

                {/* CTAs */}
                <div className="vb-ctas">
                    <Link href="/vocabulary/study" className="vb-cta primary">
                        <div className="vb-cta-ic"><Sparkles size={22} /></div>
                        <div>
                            <div className="vb-cta-tt">Sesión de hoy</div>
                            <div className="vb-cta-ds">Palabras nuevas + repasos</div>
                        </div>
                    </Link>

                    {dueCount > 0 ? (
                        <Link href="/vocabulary/study?mode=review" className="vb-cta">
                            <div className="vb-cta-ic review"><RotateCcw size={22} /></div>
                            <div>
                                <div className="vb-cta-tt">Repasar {dueCount}</div>
                                <div className="vb-cta-ds">Palabras pendientes hoy</div>
                            </div>
                        </Link>
                    ) : (
                        <div className="vb-cta" style={{ cursor: 'default' }}>
                            <div className="vb-cta-ic review"><Check size={22} /></div>
                            <div>
                                <div className="vb-cta-tt">Al día</div>
                                <div className="vb-cta-ds">No hay repasos pendientes</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── FILTROS VISUALES (Ahora de ancho completo) ─── */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', width: '100%', flexWrap: 'wrap' }}>
                    {/* Buscador: flex: 1 hace que tome todo el espacio sobrante */}
                    <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Buscar un tema..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px' }}
                        />
                    </div>
                    
                    {/* Filtro de Nivel */}
                    <div style={{ position: 'relative', minWidth: '160px' }}>
                        <Filter size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', backgroundColor: 'white', appearance: 'none', cursor: 'pointer', fontSize: '15px' }}
                        >
                            <option value="">Nivel: Todos</option>
                            {LEVEL_ORDER.map(l => (
                                <option key={l} value={l}>Nivel {l}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro de Estado (Nuevo) */}
                    <div style={{ position: 'relative', minWidth: '180px' }}>
                        <CheckCircle2 size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', backgroundColor: 'white', appearance: 'none', cursor: 'pointer', fontSize: '15px' }}
                        >
                            <option value="">Estado: Todos</option>
                            <option value="pending">No completados</option>
                            <option value="completed">Dominados</option>
                        </select>
                    </div>
                </div>

                {/* Temas por nivel (filtrados) */}
                {byLevel.length > 0 ? (
                    byLevel.map(group => (
                        <div className="vb-level" key={group.level}>
                            <div className="vb-level-label">Nivel {group.level}</div>
                            <div className="vb-themes">
                                {group.themes.map(t => {
                                    const masteredPct = t.total ? (t.mastered / t.total) * 100 : 0
                                    const learningPct = t.total ? (t.learning / t.total) * 100 : 0
                                    const complete = t.total > 0 && t.mastered === t.total

                                    return (
                                        <Link
                                            key={t.theme}
                                            href={`/vocabulary/study?theme=${encodeURIComponent(t.theme)}`}
                                            className="vb-theme"
                                        >
                                            <div className="vb-theme-name">{t.theme}</div>
                                            <div className="vb-bar">
                                                <div className="vb-bar-mastered" style={{ width: `${masteredPct}%` }} />
                                                <div className="vb-bar-learning" style={{ width: `${learningPct}%` }} />
                                            </div>
                                            <div className="vb-counts">
                                                {complete ? (
                                                    <span className="vb-done-pill"><Check size={13} /> Dominado</span>
                                                ) : (
                                                    <>
                                                        <span><b>{t.mastered}</b> dominadas</span>
                                                        <span><b>{t.learning}</b> en curso</span>
                                                        <span><b>{t.new}</b> nuevas</span>
                                                    </>
                                                )}
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                        No se encontraron temas con esos filtros.
                    </div>
                )}
            </div>
        </AppLayout>
    )
}