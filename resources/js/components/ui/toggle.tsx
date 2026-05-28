import { cva } from 'class-variance-authority';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    children?: ReactNode;
    wrapperClassName?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
    { children, wrapperClassName, className, ...rest },
    ref,
) {
    return (
        <label className={cn('toggle', wrapperClassName)}>
            <input ref={ref} type="checkbox" className={className} {...rest} />
            <span className="track" />
            {children !== undefined && <span>{children}</span>}
        </label>
    );
});

// Shadcn-compat toggleVariants used by toggle-group.tsx
export const toggleVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
    {
        variants: {
            variant: {
                default: 'bg-transparent',
                outline: 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
            },
            size: {
                default: 'h-9 px-3',
                sm: 'h-8 px-2',
                lg: 'h-10 px-3',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);
