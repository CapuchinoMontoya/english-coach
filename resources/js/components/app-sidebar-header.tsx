import { Breadcrumbs } from '@/components/breadcrumbs';
import { PalettePicker } from '@/components/layout/PalettePicker';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useSidebarCtx } from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Menu, PanelLeft } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { toggle, isMobile } = useSidebarCtx();

    return (
        <header
            style={{
                height: 56,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 16px',
                borderBottom: '1px solid var(--line)',
                background: 'var(--bg)',
                flexShrink: 0,
            }}
        >
            {/* Toggle button */}
            <button
                onClick={toggle}
                title={isMobile ? 'Menú' : 'Toggle sidebar'}
                aria-label="Menú"
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--ink-muted)',
                    flexShrink: 0,
                    transition: 'background 120ms, color 120ms',
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-sunken)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)';
                }}
            >
                {isMobile ? <Menu size={20} /> : <PanelLeft size={18} />}
            </button>

            {/* Divider */}
            {breadcrumbs.length > 0 && (
                <div style={{ width: 1, height: 18, background: 'var(--line)', flexShrink: 0 }} />
            )}

            {/* Breadcrumbs */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <PalettePicker />
                <ThemeToggle />
            </div>
        </header>
    );
}
