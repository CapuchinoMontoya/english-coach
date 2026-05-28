import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Marks the input as invalid for styling (red border, error ring) */
    invalid?: boolean;
    /** Icon rendered on the leading edge inside the input */
    leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { invalid, leadingIcon, className, ...rest },
    ref,
) {
    const input = (
        <input
            ref={ref}
            className={cn('input', invalid && 'error', className)}
            {...rest}
        />
    );

    if (!leadingIcon) return input;

    return (
        <div className="input-group">
            <span className="input-group-icon">{leadingIcon}</span>
            {input}
        </div>
    );
});
