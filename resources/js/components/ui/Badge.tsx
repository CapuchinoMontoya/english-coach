import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
    | 'default'
    | 'solid-primary'
    | 'solid-accent'
    | 'soft-success'
    | 'soft-warning'
    | 'soft-danger'
    | 'soft-info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    /** Show a small leading dot in the current color */
    dot?: boolean;
    children?: ReactNode;
}

const variantClass: Record<BadgeVariant, string> = {
    default: '',
    'solid-primary': 'solid-primary',
    'solid-accent': 'solid-accent',
    'soft-success': 'soft-success',
    'soft-warning': 'soft-warning',
    'soft-danger': 'soft-danger',
    'soft-info': 'soft-info',
};

export function Badge({ variant = 'default', dot, className, children, ...rest }: BadgeProps) {
    return (
        <span className={cn('badge', variantClass[variant], className)} {...rest}>
            {dot && <span className="dot" />}
            {children}
        </span>
    );
}
