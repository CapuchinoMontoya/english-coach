import { type HTMLAttributes, type ImgHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarTone = 'a' | 'b' | 'c' | 'd';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
    size?: AvatarSize;
    tone?: AvatarTone;
    src?: string;
    alt?: string;
    children?: ReactNode;
}

const sizeClass: Record<AvatarSize, string> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
};

export function Avatar({
    size = 'md',
    tone,
    src,
    alt = '',
    className,
    children,
    ...rest
}: AvatarProps) {
    return (
        <span
            className={cn('avatar', sizeClass[size], tone && `tone-${tone}`, className)}
            {...rest}
        >
            {src ? <img src={src} alt={alt} /> : children}
        </span>
    );
}

export interface AvatarStackProps extends HTMLAttributes<HTMLSpanElement> {
    children?: ReactNode;
}

export function AvatarStack({ className, children, ...rest }: AvatarStackProps) {
    return (
        <span className={cn('avatar-stack', className)} {...rest}>
            {children}
        </span>
    );
}

// Shadcn-compat sub-components used by user-info.tsx and app-header.tsx
export function AvatarImage({ src, alt = '', className, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
    if (!src) return null;
    return <img src={src} alt={alt} className={cn('h-full w-full object-cover', className)} {...rest} />;
}

export function AvatarFallback({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn('flex h-full w-full items-center justify-center text-xs font-medium', className)}
            {...rest}
        >
            {children}
        </span>
    );
}
