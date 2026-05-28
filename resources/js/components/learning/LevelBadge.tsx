import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type CefrLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';

export interface LevelBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    level: CefrLevel;
}

/**
 * CEFR level pill — A1 → C2.
 * Uses the warm spectrum from the design tokens.
 */
export function LevelBadge({ level, className, ...rest }: LevelBadgeProps) {
    return (
        <span className={cn('level', level, className)} {...rest}>
            {level.toUpperCase()}
        </span>
    );
}
