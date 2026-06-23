import { useState, useMemo } from 'react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import { Search, Volume2, GraduationCap } from 'lucide-react'
import './verbs.css'

interface Verb {
    id: number
    verb: string
    infinitive: string
    past: string
    participle: string
    translation: string
    example: string
    type: 'regular' | 'irregular'
}

interface Summary {
    total: number
    mastered: number
    learning: number
    due: number
    regular: number
    irregular: number
}

interface PageProps {
    verbs: Verb[]
    summary: Summary
}

const PAGE_SIZE = 20

function speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.95
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
}

export default function VerbsIndex({ verbs, summary }: PageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Verbs', href: '#' },
    ]

    const [query, setQuery] = useState('')
    const [type, setType] = useState<'' | 'regular' | 'irregular'>('')
    const [page, setPage] = useState(1)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return verbs.filter(v => {
            if (type && v.type !== type) return false
            if (q && !`${v.verb} ${v.past} ${v.participle} ${v.translation}`.toLowerCase().includes(q)) return false
            return true
        })
    }, [verbs, query, type])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const current = Math.min(page, totalPages)
    const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

    function reset<T>(setter: (v: T) => void, v: T) {
        setter(v)
        setPage(1)
    }

    const pageNumbers: (number | -1)[] = []
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= current - 2 && i <= current + 2)) pageNumbers.push(i)
        else if (pageNumbers[pageNumbers.length - 1] !== -1) pageNumbers.push(-1)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Verbs" />

            <div className="vrb">
                <div className="vrb-head">
                    <div className="vrb-title">Verbs</div>
                    <div className="vrb-sub">Aprende los verbos en contexto: cómo y cuándo se usan, no de memoria.</div>
                </div>

                {/* Stats + estudiar */}
                <div className="vrb-bar">
                    <div className="vrb-stat"><div className="vrb-stat-num">{summary.total}</div><div className="vrb-stat-lbl">Total</div></div>
                    <div className="vrb-stat"><div className="vrb-stat-num">{summary.mastered}</div><div className="vrb-stat-lbl">Dominados</div></div>
                    <div className="vrb-stat"><div className="vrb-stat-num">{summary.learning}</div><div className="vrb-stat-lbl">En curso</div></div>
                    <div className="vrb-stat"><div className="vrb-stat-num">{summary.due}</div><div className="vrb-stat-lbl">Por repasar</div></div>

                    <a className="vrb-cta" href="/verbs/study">
                        <GraduationCap size={17} /> Estudiar
                    </a>
                </div>

                {/* Controles */}
                <div className="vrb-controls">
                    <div className="vrb-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Buscar verbo o traducción…"
                            value={query}
                            onChange={e => reset(setQuery, e.target.value)}
                        />
                    </div>
                    <div className="vrb-seg">
                        <button className={type === '' ? 'active' : ''} onClick={() => reset(setType, '')}>Todos</button>
                        <button className={type === 'regular' ? 'active' : ''} onClick={() => reset(setType, 'regular')}>Regulares</button>
                        <button className={type === 'irregular' ? 'active' : ''} onClick={() => reset(setType, 'irregular')}>Irregulares</button>
                    </div>
                    <span className="vrb-count">
                        {filtered.length} verbos{totalPages > 1 ? ` · pág. ${current}/${totalPages}` : ''}
                    </span>
                </div>

                {/* Tabla */}
                {rows.length === 0 ? (
                    <div className="vrb-empty">No hay verbos que coincidan con tu búsqueda.</div>
                ) : (
                    <div className="vrb-table-wrap">
                        <table className="vrb-table">
                            <thead>
                                <tr>
                                    <th>Verbo</th>
                                    <th>Pasado</th>
                                    <th>Participio</th>
                                    <th>Traducción</th>
                                    <th>Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(v => (
                                    <tr key={v.id}>
                                        <td>
                                            <span className="vrb-base">
                                                {v.verb}
                                                <button onClick={() => speak(v.verb)} aria-label="Escuchar"><Volume2 size={15} /></button>
                                            </span>
                                        </td>
                                        <td><span className="vrb-form">{v.past}</span></td>
                                        <td><span className="vrb-form">{v.participle}</span></td>
                                        <td><span className="vrb-tr">{v.translation}</span></td>
                                        <td><span className={`vrb-badge ${v.type}`}>{v.type === 'regular' ? 'Regular' : 'Irregular'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="vrb-pager">
                        <button onClick={() => setPage(current - 1)} disabled={current === 1}>←</button>
                        {pageNumbers.map((p, i) =>
                            p === -1
                                ? <span key={`e${i}`}>…</span>
                                : <button key={p} className={p === current ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                        )}
                        <button onClick={() => setPage(current + 1)} disabled={current === totalPages}>→</button>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
