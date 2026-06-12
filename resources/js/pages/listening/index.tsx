import { useState, useMemo } from 'react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import { Clapperboard, Headphones, Play, Search } from 'lucide-react'

interface SongItem {
    id:           number
    title:        string
    artist:       string
    level:        string | null
    type:         string
    best_score:   number | null
    times_played: number
}

interface IndexProps {
    songs: SongItem[]
}

const PAGE_SIZE = 12

const LEVEL_COLORS: Record<string, string> = {
    A1: 'var(--lvl-a1)', A2: 'var(--lvl-a2)',
    B1: 'var(--lvl-b1)', B2: 'var(--lvl-b2)',
    C1: 'var(--lvl-c1)', C2: 'var(--lvl-c2)',
}

function levelColor(level: string | null) {
    return LEVEL_COLORS[level ?? ''] ?? 'var(--accent)'
}

function scoreColor(score: number) {
    if (score >= 80) return 'var(--success)'
    if (score >= 60) return 'var(--accent)'
    return 'var(--ink-muted)'
}

// ─── Select styles (shared) ───────────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
    padding: '9px 32px 9px 12px',
    border: '1px solid var(--line)',
    borderRadius: 9,
    fontSize: 13,
    color: 'var(--ink)',
    background: 'var(--bg-elevated)',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ListeningIndex({ songs }: IndexProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Listening', href: '#' },
    ]

    const [query,       setQuery      ] = useState('')
    const [filterType,  setFilterType ] = useState('')
    const [filterLevel, setFilterLevel] = useState('')
    const [page,        setPage       ] = useState(1)

    const types  = useMemo(() => [...new Set(songs.map(s => s.type).filter(Boolean))].sort(), [songs])
    const levels = useMemo(() =>
        ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].filter(l => songs.some(s => s.level === l)),
    [songs])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return songs.filter(s => {
            if (q && !s.title.toLowerCase().includes(q) && !s.artist.toLowerCase().includes(q)) return false
            if (filterType  && s.type  !== filterType)  return false
            if (filterLevel && s.level !== filterLevel) return false
            return true
        })
    }, [songs, query, filterType, filterLevel])

    const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const currentPage  = Math.min(page, totalPages)
    const paginated    = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    const playedCount  = songs.filter(s => s.times_played > 0).length

    function applyFilter<T>(setter: React.Dispatch<React.SetStateAction<T>>, val: T) {
        setter(val)
        setPage(1)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Listening Practice" />

            <div style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 20px 60px' }}>

                {/* ── Header ── */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{
                        fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontStyle: 'italic',
                        color: 'var(--primary)', lineHeight: 1.1, marginBottom: 6,
                    }}>
                        Listening Practice
                    </h1>
                    <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 20 }}>
                        Train your ear with real songs. Fill in the blanks while the music plays.
                    </p>

                    {/* Stats strip */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Catalog',  value: songs.length },
                            { label: 'Played',   value: playedCount  },
                            { label: 'Unplayed', value: songs.length - playedCount },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                padding: '10px 20px', background: 'var(--bg-elevated)',
                                border: '1px solid var(--line)', borderRadius: 10, textAlign: 'center',
                            }}>
                                <div style={{
                                    fontFamily: 'Cormorant Garamond, serif', fontSize: 28,
                                    fontWeight: 600, color: 'var(--primary)', lineHeight: 1,
                                }}>
                                    {stat.value}
                                </div>
                                <div style={{
                                    fontSize: 10, color: 'var(--ink-muted)', marginTop: 3,
                                    textTransform: 'uppercase', letterSpacing: '.07em',
                                }}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Filters ── */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
                        <Search size={14} style={{
                            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--ink-subtle)', pointerEvents: 'none',
                        }} />
                        <input
                            type="text"
                            placeholder="Search by title or artist…"
                            value={query}
                            onChange={e => applyFilter(setQuery, e.target.value)}
                            style={{
                                width: '100%', padding: '9px 12px 9px 32px',
                                border: '1px solid var(--line)', borderRadius: 9,
                                fontSize: 13, color: 'var(--ink)', background: 'var(--bg-elevated)',
                                outline: 'none', fontFamily: 'DM Sans, sans-serif',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <select value={filterType} onChange={e => applyFilter(setFilterType, e.target.value)} style={selectStyle}>
                        <option value="">All types</option>
                        {types.map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                    </select>

                    <select value={filterLevel} onChange={e => applyFilter(setFilterLevel, e.target.value)} style={selectStyle}>
                        <option value="">All levels</option>
                        {levels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>

                    <span style={{ fontSize: 12, color: 'var(--ink-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                        {filtered.length} {filtered.length === 1 ? 'song' : 'songs'}
                        {totalPages > 1 && ` · page ${currentPage}/${totalPages}`}
                    </span>
                </div>

                {/* ── Empty state ── */}
                {filtered.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '56px 24px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--line)',
                        borderRadius: 16, color: 'var(--ink-muted)',
                    }}>
                        <Headphones size={40} style={{ opacity: .3, marginBottom: 12, color: 'var(--ink)' }} />
                        <p style={{ fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>
                            {songs.length === 0 ? 'No songs in the catalog yet' : 'No songs match your filters'}
                        </p>
                        <p style={{ fontSize: 13 }}>
                            {songs.length === 0
                                ? 'Songs will appear here as your study plan grows.'
                                : 'Try clearing some filters.'}
                        </p>
                        {(query || filterType || filterLevel) && (
                            <button
                                onClick={() => { setQuery(''); setFilterType(''); setFilterLevel(''); setPage(1) }}
                                style={{
                                    marginTop: 14, padding: '8px 18px', borderRadius: 8,
                                    border: '1px solid var(--line)', background: 'var(--bg-elevated)',
                                    color: 'var(--primary)', fontSize: 13, cursor: 'pointer',
                                    fontFamily: 'DM Sans, sans-serif',
                                }}
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}

                {/* ── Card grid ── */}
                {paginated.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 16,
                        marginBottom: 28,
                    }}>
                        {paginated.map(song => <SongCard key={song.id} song={song} />)}
                    </div>
                )}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <Pagination page={currentPage} total={totalPages} onChange={setPage} />
                )}
            </div>
        </AppLayout>
    )
}

// ─── Song card ────────────────────────────────────────────────────────────────
function SongCard({ song }: { song: SongItem }) {
    const color  = levelColor(song.level)
    const isNew  = song.times_played === 0
    const isClip = song.type === 'clip'
    const Icon   = isClip ? Clapperboard : Headphones

    return (
        <div
            onClick={() => router.visit(`/listening/${song.id}`)}
            style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--line)',
                borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                transition: 'transform .15s, box-shadow .15s',
                display: 'flex', flexDirection: 'column',
            }}
            onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-3px)'
                el.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
            }}
        >
            {/* Colored header */}
            <div style={{
                background: color, padding: '20px 14px 14px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                position: 'relative',
            }}>
                {isNew && (
                    <span style={{
                        position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700,
                        padding: '2px 7px', borderRadius: 4,
                        background: 'rgba(255,255,255,.25)', color: '#fff',
                        textTransform: 'uppercase', letterSpacing: '.08em',
                    }}>
                        New
                    </span>
                )}
                <div style={{
                    width: 46, height: 46, borderRadius: '50%',
                    background: 'rgba(255,255,255,.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={22} color="#fff" />
                </div>
                {song.level && (
                    <span style={{
                        fontSize: 11, fontWeight: 700, color: '#fff',
                        letterSpacing: '.1em', textTransform: 'uppercase', opacity: .9,
                    }}>
                        {song.level}
                    </span>
                )}
            </div>

            {/* Body */}
            <div style={{ padding: '14px 14px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontStyle: 'italic',
                    color: 'var(--ink)', lineHeight: 1.25, maxHeight: '2.5em', overflow: 'hidden',
                }}>
                    {song.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    {song.artist}
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 4,
                        background: 'var(--bg-sunken)', color: 'var(--ink-muted)',
                        border: '1px solid var(--line)', textTransform: 'capitalize',
                    }}>
                        {song.type}
                    </span>

                    {song.best_score !== null && (
                        <span style={{
                            marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                            color: scoreColor(song.best_score),
                        }}>
                            {song.best_score}%
                        </span>
                    )}
                </div>
            </div>

            {/* Play button */}
            <div style={{ padding: '0 14px 14px' }}>
                <button
                    style={{
                        width: '100%', padding: '8px 0', background: color, color: '#fff',
                        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 6,
                        fontFamily: 'DM Sans, sans-serif', transition: 'opacity .12s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '.82'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                >
                    <Play size={12} fill="#fff" strokeWidth={0} />
                    {isClip ? 'Watch' : 'Play'}
                </button>
            </div>
        </div>
    )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
    const pages: (number | -1)[] = []
    const delta = 2

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= page - delta && i <= page + delta)) {
            pages.push(i)
        } else if (pages[pages.length - 1] !== -1) {
            pages.push(-1)
        }
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            <PageBtn label="←" onClick={() => onChange(page - 1)} disabled={page === 1} />
            {pages.map((p, i) =>
                p === -1
                    ? <span key={`e${i}`} style={{ padding: '7px 4px', color: 'var(--ink-subtle)', fontSize: 14, lineHeight: '34px' }}>…</span>
                    : <PageBtn key={p} label={String(p)} onClick={() => onChange(p)} active={p === page} />
            )}
            <PageBtn label="→" onClick={() => onChange(page + 1)} disabled={page === total} />
        </div>
    )
}

function PageBtn({ label, onClick, disabled, active }: {
    label: string; onClick: () => void; disabled?: boolean; active?: boolean
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                minWidth: 34, height: 34, padding: '0 10px',
                border: '1px solid var(--line)', borderRadius: 8,
                fontSize: 13, fontWeight: active ? 600 : 400,
                background: active ? 'var(--primary)' : 'var(--bg-elevated)',
                color: active ? 'var(--on-primary)' : disabled ? 'var(--ink-subtle)' : 'var(--ink)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? .4 : 1,
                transition: 'background .12s',
                fontFamily: 'DM Sans, sans-serif',
            }}
        >
            {label}
        </button>
    )
}
