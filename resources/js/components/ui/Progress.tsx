import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** 0–100 */
    value: number;
    size?: ProgressSize;
    'aria-label'?: string;
}

const sizeClass: Record<ProgressSize, string> = {
    sm: 'sm',
    md: '',
    lg: 'lg',
};

export function Progress({
    value,
    size = 'md',
    className,
    'aria-label': ariaLabel = 'Progress',
    ...rest
}: ProgressProps) {
    const clamped = Math.min(100, Math.max(0, value));
    return (
        <div
            role="progressbar"
            aria-label={ariaLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clamped}
            className={cn('progress', sizeClass[size], className)}
            {...rest}
        >
            <div className="bar" style={{ width: `${clamped}%` }} />
        </div>
    );
}
