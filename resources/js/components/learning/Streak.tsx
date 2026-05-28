import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { IconFlame } from '@/components/icons';

export interface StreakProps extends HTMLAttributes<HTMLSpanElement> {
    /** Number of consecutive days */
    days: number;
    /** Optional label to render after the number (e.g. "day streak") */
    label?: string;
}

export function Streak({ days, label, className, ...rest }: StreakProps) {
    return (
        <span className={cn('streak', className)} {...rest}>
            <span className="flame">
                <IconFlame size={14} />
            </span>
            <span>
                {days}
                {label !== undefined && (label.length > 0 ? ` ${label}` : '')}
            </span>
        </span>
    );
}
