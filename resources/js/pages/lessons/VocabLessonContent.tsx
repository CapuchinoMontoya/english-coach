import { useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'

export interface FocusWord {
    word:            string
    translation:     string
    phonetic?:       string | null
    part_of_speech?: string | null
    example?:        string | null
}

function speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.95
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

interface TipState { w: FocusWord; x: number; y: number }

/**
 * Renderiza el HTML de la mini-lección y subraya las palabras foco.
 * El HTML se inyecta de forma imperativa (fuera de React) para que los re-render
 * del tooltip NO borren los <span> subrayados.
 */
export default function VocabLessonContent({ html, words }: { html: string; words: FocusWord[] }) {
    const ref      = useRef<HTMLDivElement>(null)
    const pinned   = useRef(false)
    const [tip, setTip] = useState<TipState | null>(null)

    useEffect(() => {
        const root = ref.current
        if (!root) return

        root.innerHTML = html            // ← React ya no controla este nodo
        pinned.current = false
        setTip(null)

        if (!words || words.length === 0) return

        const map = new Map(words.map(w => [w.word.toLowerCase(), w]))
        const ordered = [...words].sort((a, b) => b.word.length - a.word.length)  // frases primero
        const pattern = new RegExp('\\b(' + ordered.map(w => escapeRegex(w.word)).join('|') + ')\\b', 'gi')

        wrapMatches(root, pattern, map)

        const showFor = (el: HTMLElement) => {
            const w = map.get((el.dataset.word ?? '').toLowerCase())
            if (!w) return
            const r = el.getBoundingClientRect()
            setTip({ w, x: r.left + r.width / 2, y: r.top })
        }

        const onOver = (e: Event) => { if (pinned.current) return; const t = e.target as HTMLElement; if (t.classList?.contains('vocab-word')) showFor(t) }
        const onOut  = (e: Event) => { if (pinned.current) return; const t = e.target as HTMLElement; if (t.classList?.contains('vocab-word')) setTip(null) }
        const onClick = (e: Event) => {
            const t = e.target as HTMLElement
            if (t.classList?.contains('vocab-word')) {
                e.preventDefault(); e.stopPropagation()
                pinned.current = true
                showFor(t)
            }
        }

        root.addEventListener('mouseover', onOver)
        root.addEventListener('mouseout', onOut)
        root.addEventListener('click', onClick)
        return () => {
            root.removeEventListener('mouseover', onOver)
            root.removeEventListener('mouseout', onOut)
            root.removeEventListener('click', onClick)
        }
    }, [html, words])

    // Click fuera → cierra el tooltip fijado
    useEffect(() => {
        const close = () => { if (pinned.current) { pinned.current = false; setTip(null) } }
        document.addEventListener('click', close)
        return () => document.removeEventListener('click', close)
    }, [])

    return (
        <div style={{ position: 'relative' }}>
            <div ref={ref} className="lesson-content" />

            {tip && (
                <div
                    className="vocab-tip"
                    style={{ position: 'fixed', left: tip.x, top: tip.y - 12, transform: 'translate(-50%, -100%)' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="vocab-tip-head">
                        <span className="vocab-tip-word">{tip.w.word}</span>
                        <button className="vocab-tip-audio" onClick={() => speak(tip.w.word)} aria-label="Escuchar">
                            <Volume2 size={14} />
                        </button>
                    </div>
                    {tip.w.phonetic && <div className="vocab-tip-phon">{tip.w.phonetic}</div>}
                    <div className="vocab-tip-tr">
                        {tip.w.part_of_speech && <em>{tip.w.part_of_speech} · </em>}
                        {tip.w.translation}
                    </div>
                    {tip.w.example && <div className="vocab-tip-ex">“{tip.w.example}”</div>}
                </div>
            )}
        </div>
    )
}

function wrapMatches(root: HTMLElement, pattern: RegExp, map: Map<string, FocusWord>) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
            const p = node.parentElement
            if (!p) return NodeFilter.FILTER_REJECT
            if (p.classList.contains('vocab-word')) return NodeFilter.FILTER_REJECT
            const tag = p.tagName.toLowerCase()
            if (tag === 'script' || tag === 'style') return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
        },
    })

    const targets: Text[] = []
    while (walker.nextNode()) targets.push(walker.currentNode as Text)

    for (const node of targets) {
        const text = node.nodeValue as string
        pattern.lastIndex = 0
        if (!pattern.test(text)) continue

        pattern.lastIndex = 0
        const frag = document.createDocumentFragment()
        let last = 0
        let m: RegExpExecArray | null

        while ((m = pattern.exec(text)) !== null) {
            const matched = m[0]
            if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)))

            if (map.has(matched.toLowerCase())) {
                const span = document.createElement('span')
                span.className = 'vocab-word'
                span.textContent = matched
                span.dataset.word = matched.toLowerCase()
                frag.appendChild(span)
            } else {
                frag.appendChild(document.createTextNode(matched))
            }
            last = m.index + matched.length
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)))

        node.parentNode?.replaceChild(frag, node)
    }
}