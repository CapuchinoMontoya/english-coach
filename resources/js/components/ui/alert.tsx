import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconInfo, IconCheckCircle, IconAlertTriangle, IconAlertCircle } from '@/components/icons';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
    tone?: AlertTone;
    title?: ReactNode;
    children?: ReactNode;
    /** Override the default icon for the tone */
    icon?: ReactNode;
    className?: string;
}

const toneIcons: Record<AlertTone, ReactNode> = {
    info: <IconInfo size={20} />,
    success: <IconCheckCircle size={20} />,
    warning: <IconAlertTriangle size={20} />,
    danger: <IconAlertCircle size={20} />,
};

export function Alert({ tone = 'info', title, icon, className, children }: AlertProps) {
    return (
        <div role="alert" className={cn('alert', tone, className)}>
            <span className="icon">{icon ?? toneIcons[tone]}</span>
            <div className="body">
                {title !== undefined && <div className="title">{title}</div>}
                {children !== undefined && <div className="text">{children}</div>}
            </div>
        </div>
    );
}
