import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
    id: string;
    label: ReactNode;
}

export interface TabsProps {
    items: TabItem[];
    /** Controlled active tab id */
    value?: string;
    /** Initial active tab id (uncontrolled) */
    defaultValue?: string;
    onChange?: (id: string) => void;
    className?: string;
}

/**
 * Underline tabs. Controlled or uncontrolled.
 *
 * @example
 *   <Tabs items={[{id:'a',label:'Overview'}, ...]} defaultValue="a" onChange={...} />
 */
export function Tabs({ items, value, defaultValue, onChange, className }: TabsProps) {
    const [internal, setInternal] = useState<string>(
        defaultValue ?? items[0]?.id ?? '',
    );
    const active = value ?? internal;

    const handle = (id: string) => {
        if (value === undefined) setInternal(id);
        onChange?.(id);
    };

    return (
        <div className={cn('tabs', className)} role="tablist">
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={item.id === active}
                    className={cn('tab', item.id === active && 'active')}
                    onClick={() => handle(item.id)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}
