import { SectionHead } from './Hero';

const SURFACE_SWATCHES = [
    { name: 'bg', value: 'surface', cssVar: 'var(--bg)' },
    { name: 'bg-elevated', value: 'card', cssVar: 'var(--bg-elevated)' },
    { name: 'bg-sunken', value: 'muted', cssVar: 'var(--bg-sunken)' },
    { name: 'ink', value: 'text', cssVar: 'var(--ink)' },
];

const BRAND_SWATCHES = [
    { name: 'primary', value: 'cocoa', cssVar: 'var(--primary)' },
    { name: 'primary-soft', value: 'tint', cssVar: 'var(--primary-soft)' },
    { name: 'accent', value: 'terracotta', cssVar: 'var(--accent)' },
    { name: 'accent-soft', value: 'tint', cssVar: 'var(--accent-soft)' },
];

const STATUS_SWATCHES = [
    { name: 'success', value: 'moss', cssVar: 'var(--success)' },
    { name: 'warning', value: 'honey', cssVar: 'var(--warning)' },
    { name: 'danger', value: 'brick', cssVar: 'var(--danger)' },
    { name: 'info', value: 'slate-blue', cssVar: 'var(--info)' },
];

const LEVEL_SWATCHES = [
    { name: 'A1', value: 'sunrise', cssVar: 'var(--lvl-a1)' },
    { name: 'A2', value: 'amber', cssVar: 'var(--lvl-a2)' },
    { name: 'B1', value: 'clay', cssVar: 'var(--lvl-b1)' },
    { name: 'B2', value: 'brick', cssVar: 'var(--lvl-b2)' },
    { name: 'C1', value: 'mahogany', cssVar: 'var(--lvl-c1)' },
    { name: 'C2', value: 'roast', cssVar: 'var(--lvl-c2)' },
];

function SwatchGrid({ items }: { items: typeof SURFACE_SWATCHES }) {
    return (
        <div className="grid grid-4 mb-4">
            {items.map((s) => (
                <div className="swatch" key={s.name}>
                    <div className="chip" style={{ background: s.cssVar }} />
                    <div className="label">
                        <span className="name">{s.name}</span>
                        <span className="value">{s.value}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ColorSection() {
    return (
        <section className="section container" id="foundations">
            <SectionHead
                number="02"
                title="Color"
                subtitle="All colors are declared in oklch() so the warm hue stays warm through tints, shades, and dark mode. Switch palettes from the nav — every component reflows."
            />
            <p className="eyebrow mb-2">Surfaces &amp; ink</p>
            <SwatchGrid items={SURFACE_SWATCHES} />
            <p className="eyebrow mb-2">Brand &amp; accent</p>
            <SwatchGrid items={BRAND_SWATCHES} />
            <p className="eyebrow mb-2">Status</p>
            <SwatchGrid items={STATUS_SWATCHES} />
            <p className="eyebrow mb-2">CEFR level scale — A1 → C2</p>
            <div className="grid mb-4" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--s-4)' }}>
                {LEVEL_SWATCHES.map((s) => (
                    <div className="swatch" key={s.name}>
                        <div className="chip" style={{ background: s.cssVar, height: 56 }} />
                        <div className="label">
                            <span className="name">{s.name}</span>
                            <span className="value">{s.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

const TYPE_SAMPLES = [
    { className: 'display', label: 'Display 80/italic', meta: '80 / 88 — Instrument Serif', text: 'Display 80/italic' },
    { className: 'h1', label: 'H1', meta: '48 / 52', text: 'H1 — A morning sip of English' },
    { className: 'h2', label: 'H2', meta: '32 / 36', text: 'H2 — Today\u2019s lesson' },
    { className: 'h3', label: 'H3', meta: '24 / 28', text: 'H3 — Listening practice' },
    { className: 'h4', label: 'H4', meta: '20 / 25 — Geist 600', text: 'H4 — Section heading' },
    { className: 'lede', label: 'Lede', meta: '20 / 30', text: 'Lede — A line that introduces a topic with a little air.' },
    { className: 'body', label: 'Body', meta: '16 / 26', text: 'Body — The standard reading text. Comfortable at sixteen pixels with line-height 1.6, ideal for short stories, lesson explanations, and feedback.' },
    { className: 'small', label: 'Small', meta: '14 / 22', text: 'Small — auxiliary captions and helper text.' },
    { className: 'eyebrow', label: 'Eyebrow', meta: '12 · 0.14em · JetBrains Mono', text: 'Eyebrow — section labels' },
];

export function TypeSection() {
    return (
        <section className="section container">
            <SectionHead
                number="03"
                title="Typography"
                subtitle="A two-voice system. Instrument Serif (italic) does emotional and editorial work — titles, words being taught, moments of warmth. Geist runs the interface."
            />
            <div className="card" style={{ padding: 'var(--s-7)' }}>
                <div className="stack" style={{ gap: 'var(--s-4)' }}>
                    {TYPE_SAMPLES.map((s) => (
                        <div key={s.label} className="row" style={{ gap: 'var(--s-5)', alignItems: 'baseline' }}>
                            <span className={s.className} style={s.className === 'body' ? { maxWidth: '60ch' } : undefined}>
                                {s.text}
                            </span>
                            <span className="mono ink-subtle" style={{ marginLeft: 'auto' }}>
                                {s.meta}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
