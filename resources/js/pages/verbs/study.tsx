import { useState, useEffect, useRef } from 'react'
import AppLayout from '@/layouts/app-layout'
import { Head, Link } from '@inertiajs/react'
import { X, Volume2, Check, ArrowRight } from 'lucide-react'
import './verbs.css'

interface Card {
    id: number
    verb: string
    infinitive: string
    past: string
    participle: string
    translation: string
    example: string
    type: 'regular' | 'irregular'
    is_new: boolean
    mode: 'conjugate'
    direction: 'es_to_en' | 'en_to_es'
}

interface PageProps {
    cards: Card[]
    type: string | null
}

function speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.95
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
}

function getCookie(name: string): string {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
    return m ? decodeURIComponent(m.pop() as string) : ''
}

const record = async (verbId: number, correct: boolean) => {
    try {
        await fetch('/verbs/answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') },
            body: JSON.stringify({ verb_id: verbId, correct }),
        })
    } catch (e) {
        console.error('record verb answer failed', e)
    }
}

// Normaliza para comparar: minúsculas, sin acentos, sin puntuación ni paréntesis
const norm = (s: string) =>
    (s ?? '')
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/[.,!?;:"'¡¿]/g, '')
        .trim()
        .replace(/\s+/g, ' ')

// ¿La respuesta coincide con alguna variante aceptada? (separadas por "/")
function matches(input: string, expected: string): boolean {
    const got = norm(input)
    if (got === '') return false
    const variants = expected.split('/').map(norm).filter(Boolean)
    variants.push(norm(expected))
    return variants.includes(got)
}

type FieldKey = 'base' | 'past' | 'participle' | 'translation'

export default function VerbsStudy({ cards }: PageProps) {
    const [index, setIndex] = useState(0)
    const [phase, setPhase] = useState<'intro' | 'question' | 'feedback'>(
        cards[0]?.is_new ? 'intro' : 'question',
    )
    const [fields, setFields] = useState<Record<FieldKey, string>>({ base: '', past: '', participle: '', translation: '' })
    const [results, setResults] = useState<Record<FieldKey, boolean>>({} as Record<FieldKey, boolean>)
    const [ok, setOk] = useState(false)
    const [correctCount, setCorrectCount] = useState(0)
    const [done, setDone] = useState(cards.length === 0)
    const firstInput = useRef<HTMLInputElement>(null)

    const card = cards[index]

    useEffect(() => {
        if (phase === 'intro' && card) speak(card.verb)
        if (phase === 'question') firstInput.current?.focus()
    }, [phase, index])

    // Qué campos pide cada dirección
    function askedFields(c: Card): FieldKey[] {
        return c.direction === 'es_to_en'
            ? ['base', 'past', 'participle']        // ve español → escribe inglés (3 formas)
            : ['translation', 'past', 'participle'] // ve base inglés → traducción + 2 formas
    }

    const expectedOf: Record<FieldKey, string> = {
        base: card?.verb ?? '',
        past: card?.past ?? '',
        participle: card?.participle ?? '',
        translation: card?.translation ?? '',
    }

    const LABELS: Record<FieldKey, string> = {
        base: 'Base (infinitivo)',
        past: 'Pasado',
        participle: 'Participio',
        translation: 'Traducción (español)',
    }

    const grade = () => {
        if (phase === 'feedback') return
        const asked = askedFields(card)
        const res = {} as Record<FieldKey, boolean>
        asked.forEach(f => { res[f] = matches(fields[f], expectedOf[f]) })
        const allOk = asked.every(f => res[f])
        setResults(res)
        setOk(allOk)
        if (allOk) setCorrectCount(c => c + 1)
        record(card.id, allOk)
        setPhase('feedback')
    }

    const next = () => {
        const n = index + 1
        if (n >= cards.length) { setDone(true); return }
        setIndex(n)
        setFields({ base: '', past: '', participle: '', translation: '' })
        setResults({} as Record<FieldKey, boolean>)
        setPhase(cards[n].is_new ? 'intro' : 'question')
    }

    const canCheck = card && askedFields(card).every(f => fields[f].trim() !== '')

    if (done) {
        const pct = cards.length ? Math.round((correctCount / cards.length) * 100) : 0
        return (
            <AppLayout breadcrumbs={[{ title: 'Verbs', href: '/verbs' }]}>
                <Head title="Verbs" />
                <div className="vrb">
                    <div className="vrb-done">
                        {cards.length === 0 ? (
                            <>
                                <div className="vrb-done-emoji">☕</div>
                                <div className="vrb-done-title">Nada por estudiar</div>
                                <div className="vrb-done-sub">No hay verbos nuevos ni repasos pendientes por ahora.</div>
                            </>
                        ) : (
                            <>
                                <div className="vrb-done-emoji">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
                                <div className="vrb-done-title">¡Sesión completa!</div>
                                <div className="vrb-done-sub">{correctCount} de {cards.length} correctas ({pct}%). Los verbos volverán para repaso según los domines.</div>
                            </>
                        )}
                        <Link href="/verbs" className="vrb-btn vrb-btn-primary" style={{ maxWidth: 240, margin: '0 auto', textDecoration: 'none' }}>
                            Volver a la tabla
                        </Link>
                    </div>
                </div>
            </AppLayout>
        )
    }

    const progressPct = (index / cards.length) * 100
    const asked = askedFields(card)

    return (
        <AppLayout breadcrumbs={[{ title: 'Verbs', href: '/verbs' }]}>
            <Head title="Estudiando verbos" />

            <div className="vrb-study">
                <div className="vrb-top">
                    <Link href="/verbs" className="vrb-close" aria-label="Salir"><X size={18} /></Link>
                    <div className="vrb-progress"><div className="vrb-progress-fill" style={{ width: `${progressPct}%` }} /></div>
                    <div className="vrb-counter">{index + 1} / {cards.length}</div>
                </div>

                {/* ── INTRO: conocer el verbo en contexto ── */}
                {phase === 'intro' && (
                    <div className="vrb-card">
                        <div className="vrb-tag new">Verbo nuevo · {card.type === 'regular' ? 'regular' : 'irregular'}</div>
                        <div className="vrb-word-row">
                            <div className="vrb-word">{card.verb}</div>
                            <button className="vrb-speak" onClick={() => speak(card.verb)} aria-label="Escuchar"><Volume2 size={18} /></button>
                        </div>
                        <div className="vrb-meaning">{card.translation}</div>

                        <div className="vrb-forms">
                            <div className="vrb-form-cell"><div className="vrb-form-lbl">Base</div><div className="vrb-form-val">{card.verb}</div></div>
                            <div className="vrb-form-cell"><div className="vrb-form-lbl">Pasado</div><div className="vrb-form-val">{card.past}</div></div>
                            <div className="vrb-form-cell"><div className="vrb-form-lbl">Participio</div><div className="vrb-form-val">{card.participle}</div></div>
                        </div>

                        <div className="vrb-context">“{card.example}”</div>

                        <div className="vrb-actions">
                            <button className="vrb-btn vrb-btn-primary" onClick={() => setPhase('question')}>
                                Practicar <ArrowRight size={17} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── PRÁCTICA: juego de conjugación (escribir) ── */}
                {phase === 'question' && (
                    <div className="vrb-card">
                        <div className="vrb-tag rev">{card.type === 'regular' ? 'Regular' : 'Irregular'}</div>
                        <div className="vrb-prompt-label">
                            {card.direction === 'es_to_en'
                                ? 'Escribe el verbo en inglés en sus tres formas'
                                : 'Escribe la traducción y las formas del verbo'}
                        </div>

                        {/* Estímulo */}
                        <div className="vrb-word-row">
                            <div className="vrb-word">
                                {card.direction === 'es_to_en' ? card.translation : card.verb}
                            </div>
                            {card.direction === 'en_to_es' && (
                                <button className="vrb-speak" onClick={() => speak(card.verb)} aria-label="Escuchar"><Volume2 size={18} /></button>
                            )}
                        </div>

                        {/* Campos a escribir */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 22 }}>
                            {asked.map((f, i) => (
                                <div key={f}>
                                    <div className="vrb-form-lbl" style={{ marginBottom: 5 }}>{LABELS[f]}</div>
                                    <input
                                        ref={i === 0 ? firstInput : undefined}
                                        className="vrb-input"
                                        value={fields[f]}
                                        onChange={e => setFields(prev => ({ ...prev, [f]: e.target.value }))}
                                        onKeyDown={e => { if (e.key === 'Enter' && canCheck) grade() }}
                                        placeholder={f === 'translation' ? 'en español…' : 'in English…'}
                                        autoCapitalize="off"
                                        autoCorrect="off"
                                        spellCheck={false}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="vrb-actions">
                            <button className="vrb-btn vrb-btn-primary" disabled={!canCheck} onClick={grade}>
                                Comprobar
                            </button>
                        </div>
                    </div>
                )}

                {/* ── FEEDBACK ── */}
                {phase === 'feedback' && (
                    <div className="vrb-card">
                        <div className="vrb-feedback">
                            <div className={`vrb-fb-icon ${ok ? 'ok' : 'no'}`}>{ok ? <Check size={32} /> : <X size={32} />}</div>
                            <div className={`vrb-fb-title ${ok ? 'ok' : 'no'}`}>{ok ? '¡Perfecto!' : 'Revisa esto'}</div>

                            {/* Detalle campo por campo */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                {asked.map(f => (
                                    <div key={f} style={{ fontSize: 15, color: results[f] ? 'var(--success)' : 'var(--danger)' }}>
                                        {results[f] ? '✓' : '✗'} {LABELS[f]}: <b>{expectedOf[f]}</b>
                                        {!results[f] && fields[f].trim() !== '' && (
                                            <span style={{ color: 'var(--ink-muted)' }}> (tú: {fields[f]})</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="vrb-fb-forms">
                                {card.verb} · <b>{card.past}</b> · <b>{card.participle}</b>
                                <button className="vrb-speak" style={{ display: 'inline-flex', marginLeft: 8, width: 30, height: 30, verticalAlign: 'middle' }} onClick={() => speak(card.verb)} aria-label="Escuchar"><Volume2 size={14} /></button>
                            </div>
                            <div className="vrb-fb-ex">“{card.example}” — {card.translation}</div>
                        </div>

                        <div className="vrb-actions">
                            <button className="vrb-btn vrb-btn-primary" autoFocus onClick={next}>
                                {index + 1 >= cards.length ? 'Terminar' : 'Siguiente'} <ArrowRight size={17} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
