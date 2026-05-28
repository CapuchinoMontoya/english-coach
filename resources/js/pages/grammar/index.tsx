import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Grammar', href: '/grammar' },
];

const topics = [
    {
        category: 'Tenses',
        items: [
            { title: 'Present Simple', desc: 'Facts, habits, and routines.', level: 'a1', done: true },
            { title: 'Past Simple', desc: 'Completed actions in the past.', level: 'a1', done: true },
            { title: 'Present Perfect', desc: 'Past actions with present relevance.', level: 'b1', done: false },
            { title: 'Future with Will & Going To', desc: 'Plans, predictions, and decisions.', level: 'a2', done: false },
        ],
    },
    {
        category: 'Sentence Structure',
        items: [
            { title: 'Articles: A, An, The', desc: 'When and how to use articles correctly.', level: 'a1', done: true },
            { title: 'Comparatives & Superlatives', desc: 'Comparing people, things, and places.', level: 'a2', done: false },
            { title: 'Conditional Sentences', desc: 'If-clauses and their consequences.', level: 'b1', done: false },
        ],
    },
];

export default function GrammarIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Grammar" />

            <div style={{ padding: 'var(--s-6)', maxWidth: 900, margin: '0 auto' }}>

                <div style={{ marginBottom: 'var(--s-7)' }}>
                    <p className="eyebrow" style={{ marginBottom: 'var(--s-2)' }}>Rules & patterns</p>
                    <h1 className="h2">Grammar</h1>
                    <p className="lede" style={{ fontSize: 'var(--fs-16)', marginTop: 'var(--s-2)' }}>
                        Clear explanations with examples you'll actually use.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-8)' }}>
                    {topics.map((topic) => (
                        <div key={topic.category}>
                            <p className="eyebrow" style={{ marginBottom: 'var(--s-4)' }}>{topic.category}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
                                {topic.items.map((item) => (
                                    <Link key={item.title} href="#" style={{ textDecoration: 'none' }}>
                                        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginBottom: 4 }}>
                                                    <span className={`level ${item.level}`}>{item.level.toUpperCase()}</span>
                                                    <span style={{ fontWeight: 600, fontSize: 'var(--fs-15)', color: 'var(--ink)' }}>{item.title}</span>
                                                </div>
                                                <p className="small" style={{ margin: 0 }}>{item.desc}</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flexShrink: 0 }}>
                                                {item.done && <span className="badge soft-success">Done</span>}
                                                <ChevronRight size={16} style={{ color: 'var(--ink-subtle)' }} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </AppLayout>
    );
}
