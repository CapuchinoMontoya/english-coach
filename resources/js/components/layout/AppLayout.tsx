import { type ReactNode } from 'react';
import { TopNav, type TopNavLink } from './TopNav';
import { Wordmark } from '@/components/brand';

export interface AppLayoutProps {
    children: ReactNode;
    /** Nav links rendered in the topbar */
    navLinks?: TopNavLink[];
    /** Hide the default footer */
    hideFooter?: boolean;
}

/**
 * Standard page shell — sticky top nav, main content, footer.
 * Use as the default Inertia layout, or compose your own pages
 * with <TopNav> directly when you need something different.
 */
export function AppLayout({ children, navLinks, hideFooter }: AppLayoutProps) {
    return (
        <>
            <TopNav links={navLinks} />
            <main id="top">{children}</main>
            {!hideFooter && (
                <footer
                    className="container"
                    style={{
                        padding: 'var(--s-11) var(--s-6) var(--s-9)',
                        borderTop: '1px solid var(--line-subtle)',
                        marginTop: 'var(--s-9)',
                    }}
                >
                    <div
                        className="row"
                        style={{
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            gap: 'var(--s-7)',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div>
                            <Wordmark size="lg" />
                            <p
                                className="ink-muted small"
                                style={{ marginTop: 'var(--s-3)', maxWidth: '42ch' }}
                            >
                                An English-language platform built like a daily ritual.
                            </p>
                        </div>
                        <p className="mono small ink-subtle">
                            © {new Date().getFullYear()} Capuchino
                        </p>
                    </div>
                </footer>
            )}
        </>
    );
}
