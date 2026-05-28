import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface AppMarkProps extends HTMLAttributes<HTMLSpanElement> {
    size?: number;
    /** Letter inside the mark — defaults to "C" */
    letter?: string;
}

/**
 * Square app icon mark — italic "C" on a dark square with the terracotta dot.
 * Used for favicons, app launchers, and tight UI spaces.
 */
export function AppMark({
    size = 44,
    letter = 'C',
    className,
    style,
    ...rest
}: AppMarkProps) {
    const radius = size * 0.27;
    const fontSize = size * 0.59;
    return (
        <span
            className={cn('appmark', className)}
            style={{ width: size, height: size, borderRadius: radius, fontSize, ...style }}
            {...rest}
        >
            {letter}
        </span>
    );
}
