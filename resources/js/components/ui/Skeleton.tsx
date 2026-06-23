import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    width?: number | string;
    height?: number | string;
}

export function Skeleton({ width, height, className, style, ...rest }: SkeletonProps) {
    return (
        <div
            aria-hidden
            className={cn('skeleton', className)}
            style={{ width, height, ...style }}
            {...rest}
        />
    );
}
