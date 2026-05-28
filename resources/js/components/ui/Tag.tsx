import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function Tag({ className, type = 'button', children, ...rest }: TagProps) {
    return (
        <button type={type} className={cn('tag', className)} {...rest}>
            {children}
        </button>
    );
}
