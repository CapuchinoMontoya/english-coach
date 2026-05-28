import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type QuizOptionState = 'idle' | 'selected' | 'correct' | 'wrong';

export interface QuizOptionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    /** Single-letter or short identifier shown in the round badge */
    letter: string;
    /** The option's text content */
    children: ReactNode;
    state?: QuizOptionState;
}

const stateClass: Record<QuizOptionState, string> = {
    idle: '',
    selected: 'selected',
    correct: 'correct',
    wrong: 'wrong',
};

export function QuizOption({
    letter,
    state = 'idle',
    className,
    children,
    type = 'button',
    ...rest
}: QuizOptionProps) {
    return (
        <button
            type={type}
            className={cn('quiz-option', stateClass[state], className)}
            {...rest}
        >
            <span className="letter">{letter}</span>
            <span>{children}</span>
        </button>
    );
}
