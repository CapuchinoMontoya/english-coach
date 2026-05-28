import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconClose } from '@/components/icons';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    /** Small label above the title */
    eyebrow?: ReactNode;
    /** Footer actions — render whatever buttons you want */
    footer?: ReactNode;
    children?: ReactNode;
    className?: string;
    /** Max width override (default 480px) */
    maxWidth?: number | string;
}

/**
 * Lightweight modal. Self-contained portal-free implementation — renders
 * inline as a fixed overlay. Closes on Escape and backdrop click.
 */
export function Modal({
    open,
    onClose,
    title,
    eyebrow,
    footer,
    children,
    className,
    maxWidth,
}: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'oklch(0.10 0.02 50 / 0.45)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                display: 'grid',
                placeItems: 'center',
                padding: 'var(--s-6)',
                zIndex: 100,
            }}
        >
            <div
                className={cn('modal-mock', className)}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: maxWidth ?? 480, width: '100%' }}
            >
                <button type="button" className="close" onClick={onClose} aria-label="Close">
                    <IconClose size={16} />
                </button>
                {eyebrow !== undefined && <p className="eyebrow mb-2">{eyebrow}</p>}
                {title !== undefined && (
                    <h3
                        className="h3 mb-2"
                        style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
                    >
                        {title}
                    </h3>
                )}
                {children}
                {footer !== undefined && (
                    <div className="row mt-3">{footer}</div>
                )}
            </div>
        </div>
    );
}
