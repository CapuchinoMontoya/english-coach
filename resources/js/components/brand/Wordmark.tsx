import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type WordmarkSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WordmarkProps extends HTMLAttributes<HTMLSpanElement> {
    size?: WordmarkSize;
    /** Wordmark text — defaults to "Capuchino" */
    text?: string;
    /** Show the accent dot at the end of the wordmark */
    dot?: boolean;
}

const sizeClass: Record<WordmarkSize, string> = {
    sm: '',
    md: '',
    lg: 'lg',
    xl: 'xl',
};

const sizeFontSize: Record<WordmarkSize, string | undefined> = {
    sm: 'var(--fs-20)',
    md: undefined,
    lg: undefined,
    xl: undefined,
};

export function Wordmark({
    size = 'md',
    text = 'Capuchino',
    dot = true,
    className,
    style,
    ...rest
}: WordmarkProps) {
    const fontSize = sizeFontSize[size];
    return (
        <span
            className={cn('wordmark', sizeClass[size], className)}
            style={fontSize ? { fontSize, ...style } : style}
            {...rest}
        >
            {text}
            {dot && <span className="dot" />}
        </span>
    );
}
