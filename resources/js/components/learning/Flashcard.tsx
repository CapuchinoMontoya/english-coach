import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FlashcardProps {
    /** The word being taught */
    word: ReactNode;
    /** Phonetic transcription, e.g. "/ˌsɛrənˈdɪpəti/" */
    pronunciation?: ReactNode;
    /** Part of speech, e.g. "noun · uncountable" */
    partOfSpeech?: ReactNode;
    /** Definition or example */
    definition?: ReactNode;
    /** Small label above the word (e.g. "Today's word") */
    eyebrow?: ReactNode;
    /** Action buttons or other footer content */
    actions?: ReactNode;
    className?: string;
}

/**
 * Vocabulary flashcard. Italic-serif word, with the soft printed-card
 * styling from the design system (a faint stacked card behind it).
 */
export function Flashcard({
    word,
    pronunciation,
    partOfSpeech,
    definition,
    eyebrow,
    actions,
    className,
}: FlashcardProps) {
    return (
        <div className={cn('flashcard', className)}>
            {eyebrow !== undefined && <span className="eyebrow">{eyebrow}</span>}
            <span className="word">{word}</span>
            {pronunciation !== undefined && <span className="pron">{pronunciation}</span>}
            {partOfSpeech !== undefined && <span className="pos">{partOfSpeech}</span>}
            {definition !== undefined && (
                <p
                    className="small"
                    style={{ maxWidth: '38ch', margin: 'var(--s-3) auto 0' }}
                >
                    {definition}
                </p>
            )}
            {actions !== undefined && (
                <div className="row" style={{ justifyContent: 'center', marginTop: 'var(--s-5)' }}>
                    {actions}
                </div>
            )}
        </div>
    );
}
