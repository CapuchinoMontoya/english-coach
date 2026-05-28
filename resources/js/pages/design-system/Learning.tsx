import { useState } from 'react';
import { Button } from '@/components/ui';
import { Flashcard, LessonCard, QuizOption, type QuizOptionState } from '@/components/learning';
import { SectionHead } from './Hero';

interface QuizState {
    selected: string | null;
    revealed: boolean;
}

const CORRECT_ANSWER = 'd';

export function LearningSection() {
    const [quiz, setQuiz] = useState<QuizState>({ selected: null, revealed: false });

    const stateFor = (id: string): QuizOptionState => {
        if (!quiz.revealed) return quiz.selected === id ? 'selected' : 'idle';
        if (id === CORRECT_ANSWER) return 'correct';
        if (id === quiz.selected) return 'wrong';
        return 'idle';
    };

    const pickOption = (id: string) => {
        if (quiz.revealed) return;
        setQuiz({ selected: id, revealed: false });
    };

    return (
        <section className="section container" id="learning">
            <SectionHead
                number="06"
                title="Learning primitives"
                subtitle="The pieces unique to a language platform. Each one is designed to feel like a small printed object — a flashcard, an index card, a postcard from a coach."
            />

            <p className="eyebrow mb-2">Lesson cards</p>
            <div className="grid grid-3 gap-3 mb-4">
                <LessonCard
                    level="a2"
                    durationMinutes={8}
                    kind="conversation"
                    glyph="Aa"
                    title="The art of the small talk"
                    description="Five everyday exchanges, slowed down so you can hear every word — then sped up so you can keep up."
                    footer="★ 4.8 · 1,240 learners"
                />
                <LessonCard
                    level="b1"
                    durationMinutes={12}
                    kind="grammar"
                    thumbColor="var(--lvl-b1)"
                    glyph="¶"
                    title="Past tense, on purpose"
                    description="Irregular verbs that earn their keep — taught through a short story you'll actually remember."
                    footer="★ 4.9 · new this week"
                />
                <LessonCard
                    level="b2"
                    durationMinutes={15}
                    kind="live coach"
                    thumbColor="var(--ink)"
                    glyph="&"
                    title="Phrasal verbs over coffee"
                    description="A live thirty-question drill with Anya. She'll correct you, gently, every time."
                    cta="Book →"
                />
            </div>

            <p className="eyebrow mb-2">Flashcard &amp; quiz</p>
            <div className="grid grid-2 gap-3 mb-4">
                <Flashcard
                    eyebrow="Today's word"
                    word="serendipity"
                    pronunciation="/ˌsɛrənˈdɪpəti/"
                    partOfSpeech="noun · uncountable"
                    definition="The happy occurrence of finding something good without looking for it."
                    actions={
                        <>
                            <Button variant="secondary" size="sm">Too easy</Button>
                            <Button variant="secondary" size="sm">Got it</Button>
                            <Button variant="secondary" size="sm">Show again</Button>
                        </>
                    }
                />

                <div className="card" style={{ padding: 'var(--s-7)' }}>
                    <span className="eyebrow">Question 4 of 10</span>
                    <h3
                        className="h3"
                        style={{
                            margin: 'var(--s-3) 0 var(--s-5)',
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic',
                            fontWeight: 400,
                        }}
                    >
                        Choose the natural reply.
                    </h3>
                    <p className="ink-muted small mb-3" style={{ fontStyle: 'italic' }}>
                        "How was your weekend?"
                    </p>
                    <div className="stack" style={{ gap: 10 }}>
                        <QuizOption letter="A" state={stateFor('a')} onClick={() => pickOption('a')}>
                            It was a weekend of two days.
                        </QuizOption>
                        <QuizOption letter="B" state={stateFor('b')} onClick={() => pickOption('b')}>
                            Pretty quiet — I caught up on sleep, mostly.
                        </QuizOption>
                        <QuizOption letter="C" state={stateFor('c')} onClick={() => pickOption('c')}>
                            My weekend has been very weekend.
                        </QuizOption>
                        <QuizOption letter="D" state={stateFor('d')} onClick={() => pickOption('d')}>
                            Not bad, thanks — how about yours?
                        </QuizOption>
                    </div>
                    <div className="row mt-3" style={{ justifyContent: 'flex-end' }}>
                        {quiz.revealed ? (
                            <Button variant="ghost" onClick={() => setQuiz({ selected: null, revealed: false })}>
                                Try again
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                disabled={!quiz.selected}
                                onClick={() => setQuiz((q) => ({ ...q, revealed: true }))}
                            >
                                Check answer
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
