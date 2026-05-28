import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { invalid, className, ...rest },
    ref,
) {
    return (
        <textarea
            ref={ref}
            className={cn('textarea', invalid && 'error', className)}
            {...rest}
        />
    );
});
