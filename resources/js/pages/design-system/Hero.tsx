import { Wordmark } from '@/components/brand';
import { Badge, Button } from '@/components/ui';

export function HeroSection() {
    return (
        <section className="container" style={{ padding: 'var(--s-12) var(--s-6) var(--s-9)' }}>
            <div className="row" style={{ gap: 'var(--s-3)', marginBottom: 'var(--s-4)' }}>
                <span className="eyebrow">Design system v1.0</span>
                <Badge>Laravel · Inertia · React · Bootstrap grid</Badge>
            </div>
            <h1 className="display" style={{ maxWidth: '14ch' }}>
                English, served <span style={{ color: 'var(--accent)' }}>warm.</span>
            </h1>
            <p className="lede" style={{ maxWidth: '60ch', marginTop: 'var(--s-5)' }}>
                Capuchino is a language platform built like a daily ritual — small, warm,
                addictive. The design system below is the entire vocabulary the product
                speaks in: tokens, components, and learning primitives, all of them
                behaving consistently across light and dark, and across three palettes.
            </p>
            <div className="row" style={{ marginTop: 'var(--s-6)', gap: 'var(--s-3)' }}>
                <Button variant="primary" size="lg" onClick={() => document.getElementById('components')?.scrollIntoView({ behavior: 'smooth' })}>
                    Browse components
                </Button>
                <Button variant="ghost" size="lg" onClick={() => document.getElementById('brand')?.scrollIntoView({ behavior: 'smooth' })}>
                    Why "Capuchino"?
                </Button>
            </div>
        </section>
    );
}

export function SectionHead({
    number,
    title,
    subtitle,
}: {
    number: string;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="section-head">
            <span className="number">{number}</span>
            <h2 className="h2">{title}</h2>
            <span className="ink-muted" style={{ marginLeft: 'auto', maxWidth: '38ch' }}>
                {subtitle}
            </span>
        </div>
    );
}

export function BrandSection() {
    return (
        <section className="section container" id="brand">
            <SectionHead
                number="01"
                title="The mark"
                subtitle="An italic serif wordmark with a single accent dot — quiet, editorial, and recognizable at a glance. A daily ritual deserves a mark that feels printed, not generated."
            />
            <div className="card" style={{ padding: 'var(--s-9)', textAlign: 'center' }}>
                <Wordmark size="xl" style={{ fontSize: 'clamp(3rem, 9vw, 6rem)' }} />
                <p className="ink-muted mono" style={{ marginTop: 'var(--s-5)', fontSize: 'var(--fs-13)' }}>
                    Instrument Serif Italic · letterspacing −0.015em · accent dot at the i-stem
                </p>
            </div>
        </section>
    );
}
