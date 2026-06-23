import { Slot } from '@radix-ui/react-slot';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'accent'
    | 'danger'
    | 'destructive'  // alias for danger (Shadcn compat)
    | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
    /** Render children as the direct child element (Radix Slot pattern) */
    asChild?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    accent: 'btn-accent',
    danger: 'btn-danger',
    destructive: 'btn-danger',
    link: 'btn-link',
};

const sizeClass: Record<ButtonSize, string> = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    xl: 'btn-xl',
    icon: 'btn-icon',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        variant = 'primary',
        size = 'md',
        leadingIcon,
        trailingIcon,
        asChild = false,
        className,
        children,
        type = 'button',
        ...rest
    },
    ref,
) {
    const Comp = asChild ? Slot : 'button';
    return (
        <Comp
            ref={ref}
            type={type}
            className={cn('btn', variantClass[variant], sizeClass[size], className)}
            {...rest}
        >
            {leadingIcon}
            {children}
            {trailingIcon}
        </Comp>
    );
});
