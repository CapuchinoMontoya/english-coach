import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Flashcards', href: '/flashcards' },
];

const cards = [
    { word: 'ephemeral', pron: '/ɪˈfem(ə)r(ə)l/', pos: 'adjective', definition: 'Lasting for a very short time.' },
    { word: 'tenacious', pron: '/tɪˈneɪʃəs/', pos: 'adjective', definition: 'Holding firmly to a position; persistent.' },
    { word: 'ambiguous', pron: '/amˈbɪɡjʊəs/', pos: 'adjective', definition: 'Open to more than one interpretation; unclear.' },
    { word: 'resilient', pron: '/rɪˈzɪlɪənt/', pos: 'adjective', definition: 'Able to recover quickly from difficulties.' },
    { word: 'eloquent', pron: '/ˈeləkwənt/', pos: 'adjective', definition: 'Well-spoken; expressing ideas clearly and effectively.' },
];

export default function FlashcardsIndex() {
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [done, setDone] = useState(false);
    const [score, setScore] = useState({ knew: 0, missed: 0 });

    const current = cards[index];

    function next(knew: boolean) {
        setScore(s => knew ? { ...s, knew: s.knew + 1 } : { ...s, missed: s.missed + 1 });
        if (index + 1 >= cards.length) {
            setDone(true);
        } else {
            setIndex(i => i + 1);
            setFlipped(false);
        }
    }

    function restart() {
        setIndex(0);
        setFlipped(false);
        setDone(false);
        setScore({ knew: 0, missed: 0 });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Flashcards" />

            <div style={{ padding: 'var(--s-6)', maxWidth: 600, margin: '0 auto' }}>

                <div style={{ marginBottom: 'var(--s-7)' }}>
                    <p className="eyebrow" style={{ marginBottom: 'var(--s-2)' }}>Spaced repetition</p>
                    <h1 className="h2">Flashcards</h1>
                    <p className="lede" style={{ fontSize: 'var(--fs-16)', marginTop: 'var(--s-2)' }}>
                        Review and reinforce your vocabulary.
                    </p>
                </div>

                {done ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--s-9)' }}>
                        <p style={{ fontSize: 60 }}>🎉</p>
                        <h2 className="h3" style={{ marginTop: 'var(--s-4)' }}>Round complete!</h2>
                        <p className="lede" style={{ fontSize: 'var(--fs-16)', marginTop: 'var(--s-2)' }}>
                            You knew <strong>{score.knew}</strong> and missed <strong>{score.missed}</strong> out of {cards.length} cards.
                        </p>
                        <button className="btn btn-primary btn-lg" style={{ marginTop: 'var(--s-6)' }} onClick={restart}>
                            <RotateCcw size={16} />
                            Practice again
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s-4)' }}>
                            <span className="small mono">{index + 1} / {cards.length}</span>
                            <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
                                <span className="badge soft-success">{score.knew} knew</span>
                                <span className="badge soft-danger">{score.missed} missed</span>
                            </div>
                        </div>

                        <div className="progress" style={{ marginBottom: 'var(--s-6)' }}>
                            <div className="bar" style={{ width: `${(index / cards.length) * 100}%` }} />
                        </div>

                        <div
                            className="flashcard"
                            onClick={() => setFlipped(f => !f)}
                            style={{ cursor: 'pointer', userSelect: 'none', minHeight: 280 }}
                        >
                            {!flipped ? (
                                <>
                                    <div className="word">{current.word}</div>
                                    <p className="pron">{current.pron}</p>
                                    <span className="badge" style={{ alignSelf: 'center' }}>{current.pos}</span>
                                    <p className="micro" style={{ marginTop: 'var(--s-4)' }}>Tap to reveal definition</p>
                                </>
                            ) : (
                                <>
                                    <div className="word" style={{ fontSize: 'var(--fs-32)' }}>{current.word}</div>
                                    <p className="body" style={{ marginTop: 'var(--s-3)' }}>{current.definition}</p>
                                </>
                            )}
                        </div>

                        {flipped && (
                            <div style={{ display: 'flex', gap: 'var(--s-4)', marginTop: 'var(--s-5)', justifyContent: 'center' }}>
                                <button className="btn btn-lg" style={{ flex: 1, background: 'var(--danger-soft)', color: 'var(--danger)', border: 'none' }} onClick={() => next(false)}>
                                    <ThumbsDown size={18} />
                                    Missed it
                                </button>
                                <button className="btn btn-lg" style={{ flex: 1, background: 'var(--success-soft)', color: 'var(--success)', border: 'none' }} onClick={() => next(true)}>
                                    <ThumbsUp size={18} />
                                    Knew it!
                                </button>
                            </div>
                        )}
                    </>
                )}

            </div>
        </AppLayout>
    );
}
