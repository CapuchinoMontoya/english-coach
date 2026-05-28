import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { invalid, className, children, ...rest },
    ref,
) {
    return (
        <select
            ref={ref}
            className={cn('select', invalid && 'error', className)}
            {...rest}
        >
            {children}
        </select>
    );
});
