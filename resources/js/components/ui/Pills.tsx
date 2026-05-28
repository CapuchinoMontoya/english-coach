import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PillItem {
    id: string;
    label: ReactNode;
}

export interface PillsProps {
    items: PillItem[];
    value?: string;
    defaultValue?: string;
    onChange?: (id: string) => void;
    className?: string;
    'aria-label'?: string;
}

/**
 * Segmented pill control. Useful for filter strips ("All / A1–A2 / B1–B2").
 */
export function Pills({
    items,
    value,
    defaultValue,
    onChange,
    className,
    'aria-label': ariaLabel,
}: PillsProps) {
    const [internal, setInternal] = useState<string>(
        defaultValue ?? items[0]?.id ?? '',
    );
    const active = value ?? internal;

    const handle = (id: string) => {
        if (value === undefined) setInternal(id);
        onChange?.(id);
    };

    return (
        <div className={cn('pills', className)} role="tablist" aria-label={ariaLabel}>
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={item.id === active}
                    className={cn('pill', item.id === active && 'active')}
                    onClick={() => handle(item.id)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}
