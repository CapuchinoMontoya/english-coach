import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ── Sidebar state context ─────────────────────────────────────────────────────
interface SidebarCtxType {
    open: boolean;        // colapsado/expandido (escritorio)
    toggle: () => void;   // alterna: colapso en escritorio, drawer en móvil
    isMobile: boolean;
    mobileOpen: boolean;  // drawer visible (móvil)
    closeMobile: () => void;
}

export const SidebarCtx = createContext<SidebarCtxType>({
    open: true,
    toggle: () => {},
    isMobile: false,
    mobileOpen: false,
    closeMobile: () => {},
});
export const useSidebarCtx = () => useContext(SidebarCtx);

const MOBILE_BREAKPOINT = 768;

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
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
    );
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobile(mobile);
            if (!mobile) setMobileOpen(false); // al volver a escritorio, cierra el drawer
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const toggle = () => {
        if (isMobile) {
            setMobileOpen((o) => !o);
        } else {
            setOpen((o) => {
                const next = !o;
                localStorage.setItem('sidebar', String(next));
                return next;
            });
        }
    };

    const closeMobile = () => setMobileOpen(false);

    return (
        <SidebarCtx.Provider value={{ open, toggle, isMobile, mobileOpen, closeMobile }}>
            <div
                style={{
                    display: 'flex',
                    height: '100dvh',
                    overflow: 'hidden',
                    background: 'var(--bg)',
                }}
            >
                <AppSidebar />

                {/* Backdrop del drawer en móvil */}
                {isMobile && mobileOpen && (
                    <div
                        onClick={closeMobile}
                        aria-hidden="true"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.45)',
                            zIndex: 40,
                            animation: 'cap-fade 160ms ease',
                        }}
                    />
                )}

                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        minWidth: 0,
                        backgroundColor: 'var(--bg)',
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
