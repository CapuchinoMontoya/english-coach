import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { createContext, useContext, useState, type ReactNode } from 'react';

// ── Sidebar state context ─────────────────────────────────────────────────────
interface SidebarCtxType {
    open: boolean;
    toggle: () => void;
}

export const SidebarCtx = createContext<SidebarCtxType>({ open: true, toggle: () => { } });
export const useSidebarCtx = () => useContext(SidebarCtx);

// ── Layout ────────────────────────────────────────────────────────────────────
export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}) {
    const [open, setOpen] = useState(() => {
        if (typeof window === 'undefined') return true;
        return localStorage.getItem('sidebar') !== 'false';
    });

    const toggle = () => {
        setOpen((o) => {
            const next = !o;
            localStorage.setItem('sidebar', String(next));
            return next;
        });
    };

    return (
        <SidebarCtx.Provider value={{ open, toggle }}>
            <div
                style={{
                    display: 'flex',
                    height: '100dvh',
                    overflow: 'hidden',
                    background: 'var(--bg)',
                }}
            >
                <AppSidebar />
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        minWidth: 0,
                        // --- Agrega estas 3 líneas ---
                        backgroundColor: 'var(--bg)', // O 'white' / '#ffffff' si usas colores fijos
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
                </div>
            </div>
        </SidebarCtx.Provider>
    );
}
