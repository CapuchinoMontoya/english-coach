import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ToastProps {
    icon?: ReactNode;
    children?: ReactNode;
    className?: string;
}

/**
 * Visual toast pill. Mounting/dismissal is left to your toast host
 * (e.g. react-hot-toast, sonner). This component just renders the chrome.
 */
export function Toast({ icon, className, children }: ToastProps) {
    return (
        <div role="status" className={cn('toast', className)}>
            {icon}
            <span>{children}</span>
        </div>
    );
}
