import { type AnchorHTMLAttributes, type ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { Wordmark } from '@/components/brand';
import { ThemeToggle } from './ThemeToggle';
import { PalettePicker } from './PalettePicker';

export interface TopNavLink {
    label: ReactNode;
    href: string;
    active?: boolean;
}

export interface TopNavProps {
    links?: TopNavLink[];
    /** Inertia-managed nav: pass `true` to use <Link>, `false` for plain anchors. */
    useInertiaLinks?: boolean;
    /** Where the wordmark should link to (default "/") */
    homeHref?: string;
    /** Extra content rendered on the right, before the toggles */
    rightSlot?: ReactNode;
}

/**
 * The top-of-page navigation: wordmark on the left, links in the middle,
 * palette + theme toggles on the right. Sticky, blurred, theme-aware.
 */
/** Anchor-aware link renderer: plain <a> for "#…" hash links, Inertia <Link> otherwise. */
function NavLink({
    href,
    useInertiaLinks,
    className,
    children,
    ...rest
}: {
    href: string;
    useInertiaLinks: boolean;
    className?: string;
    children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
    const isHash = href.startsWith('#');
    if (!useInertiaLinks || isHash) {
        return (
            <a href={href} className={className} {...rest}>
                {children}
            </a>
        );
    }
    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}

export function TopNav({
    links = [],
    useInertiaLinks = true,
    homeHref = '/',
    rightSlot,
}: TopNavProps) {
    return (
        <header className="topnav">
            <div className="topnav-inner">
                <NavLink href={homeHref} useInertiaLinks={useInertiaLinks} aria-label="Capuchino home">
                    <Wordmark />
                </NavLink>

                {links.length > 0 && (
                    <nav className="topnav-links" aria-label="Primary">
                        {links.map((link, i) => (
                            <NavLink
                                key={i}
                                href={link.href}
                                useInertiaLinks={useInertiaLinks}
                                className={link.active ? 'active' : undefined}
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                )}

                <div
                    className="row"
                    style={{ gap: 'var(--s-3)', marginLeft: links.length > 0 ? undefined : 'auto' }}
                >
                    {rightSlot}
                    <PalettePicker />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
