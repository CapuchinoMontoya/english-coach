import { type HTMLAttributes, type ReactNode } from 'react';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
}

export function Kbd({ children, ...rest }: KbdProps) {
    return <kbd {...rest}>{children}</kbd>;
}
