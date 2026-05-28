import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus, Volume2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Vocabulary', href: '/vocabulary' },
];

const words = [
    { word: 'serendipity', pron: '/ˌserənˈdipɪti/', pos: 'noun', definition: 'Finding something good without looking for it.', mastered: true },
    { word: 'eloquent', pron: '/ˈeləkwənt/', pos: 'adjective', definition: 'Well-spoken; expressing ideas clearly and effectively.', mastered: true },
    { word: 'ephemeral', pron: '/ɪˈfem(ə)r(ə)l/', pos: 'adjective', definition: 'Lasting for a very short time.', mastered: false },
    { word: 'tenacious', pron: '/tɪˈneɪʃəs/', pos: 'adjective', definition: 'Holding firmly to a position; persistent.', mastered: false },
    { word: 'ambiguous', pron: '/amˈbɪɡjʊəs/', pos: 'adjective', definition: 'Open to more than one interpretation; unclear.', mastered: false },
    { word: 'resilient', pron: '/rɪˈzɪlɪənt/', pos: 'adjective', definition: 'Able to recover quickly from difficulties.', mastered: true },
];

export default function VocabularyIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vocabulary" />

            <div style={{ padding: 'var(--s-6)', maxWidth: 900, margin: '0 auto' }}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s-4)', marginBottom: 'var(--s-7)' }}>
                    <div>
                        <p className="eyebrow" style={{ marginBottom: 'var(--s-2)' }}>Your word bank</p>
                        <h1 className="h2">Vocabulary</h1>
                        <p className="lede" style={{ fontSize: 'var(--fs-16)', marginTop: 'var(--s-2)' }}>
                            {words.filter(w => w.mastered).length} of {words.length} words mastered.
                        </p>
                    </div>
                    <button className="btn btn-primary">
                        <Plus size={16} />
                        Add word
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                    {words.map((w) => (
                        <div key={w.word} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-5)', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 180 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s-3)' }}>
                                    <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'var(--fs-24)', color: 'var(--ink)' }}>{w.word}</span>
                                    <span className="pos badge">{w.pos}</span>
                                </div>
                                <p className="small mono" style={{ margin: '2px 0 0', color: 'var(--ink-subtle)' }}>{w.pron}</p>
                            </div>
                            <p className="small" style={{ flex: 2, minWidth: 200, margin: 0, color: 'var(--ink-muted)' }}>{w.definition}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flexShrink: 0 }}>
                                {w.mastered
                                    ? <span className="badge soft-success">Mastered</span>
                                    : <span className="badge soft-warning">Learning</span>
                                }
                                <button className="btn btn-icon btn-ghost btn-sm" title="Listen">
                                    <Volume2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'var(--s-6)', textAlign: 'center' }}>
                    <Link href="/flashcards" className="btn btn-secondary">
                        Practice with flashcards
                    </Link>
                </div>

            </div>
        </AppLayout>
    );
}
