import { useSidebarCtx } from '@/layouts/app/app-sidebar-layout';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart2,
    BookOpen,
    Flame,
    Headphones,
    Layers,
    LayoutDashboard,
    Library,
    LogOut,
    Settings,
    Sparkles,
} from 'lucide-react';
import { useInitials } from '@/hooks/use-initials';
import AppLogo from './app-logo';

interface NavItem {
    title: string;
    url: string;
    icon: React.ElementType;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        title: 'Home',
        items: [{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard }],
    },
    {
        title: 'Learn',
        items: [
            { title: 'Lessons', url: '/lessons', icon: BookOpen },
            { title: 'Vocabulary', url: '/vocabulary', icon: Library },
            { title: 'Grammar', url: '/grammar', icon: Sparkles },
        ],
    },
    {
        title: 'Practice',
        items: [
            { title: 'Listening', url: '/listening', icon: Headphones },
            { title: 'Flashcards', url: '/flashcards', icon: Layers },
        ],
    },
    {
        title: 'My Progress',
        items: [
            { title: 'Progress', url: '/progress', icon: BarChart2 },
            { title: 'Streak', url: '/streak', icon: Flame },
        ],
    },
];

export function AppSidebar() {
    const { open } = useSidebarCtx();
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();

    const W = open ? 240 : 60;

    return (
        <aside
            style={{
                width: W,
                minWidth: W,
                height: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-sunken)',
                borderRight: '1px solid var(--line)',
                transition: 'width 200ms cubic-bezier(0.2,0.7,0.2,1), min-width 200ms cubic-bezier(0.2,0.7,0.2,1)',
                overflow: 'hidden',
                flexShrink: 0,
            }}
        >
            {/* ── Logo ── */}
            <div
                style={{
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    /* Eliminamos los paddings condicionales de aquí */
                    borderBottom: '1px solid var(--line)',
                    flexShrink: 0,
                }}
            >
                <Link
                    href="/dashboard"
                    prefetch
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        overflow: 'hidden',
                        width: '100%',
                        height: '100%', /* Ocupa todo el alto del padre */

                        /* --- ESTA ES LA CLAVE DEL CENTRADO --- */
                        /* Si está abierto, gap de 10px y padding a la izquierda.
                           Si está cerrado, sin gap y sin padding para centrar. */
                        gap: open ? 10 : 0,
                        padding: open ? '0 12px' : '0',
                        justifyContent: open ? 'flex-start' : 'center',
                    }}
                >
                    <AppLogo open={open} />
                </Link>
            </div>

            {/* ── Nav ── */}
            <nav
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '8px 0',
                }}
            >
                {navGroups.map((group) => (
                    <div key={group.title} style={{ marginBottom: 8 }}>
                        {open && (
                            <p
                                style={{
                                    fontSize: 10,
                                    fontFamily: 'var(--font-mono)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.12em',
                                    color: 'var(--ink-subtle)',
                                    fontWeight: 600,
                                    padding: '4px 16px 4px',
                                    margin: 0,
                                }}
                            >
                                {group.title}
                            </p>
                        )}
                        {!open && <div style={{ height: 8 }} />}
                        {group.items.map((item) => {
                            const isActive = page.url.startsWith(item.url);
                            return (
                                <Link
                                    key={item.title}
                                    href={item.url}
                                    prefetch
                                    title={!open ? item.title : undefined}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: open ? '8px 12px' : '8px 0',
                                        margin: '1px 8px',
                                        borderRadius: 8,
                                        textDecoration: 'none',
                                        fontSize: 'var(--fs-14)',
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
                                        background: isActive ? 'var(--bg-elevated)' : 'transparent',
                                        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                                        transition: 'all 120ms',
                                        justifyContent: open ? 'flex-start' : 'center',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <item.icon
                                        size={18}
                                        style={{
                                            flexShrink: 0,
                                            color: isActive ? 'var(--accent)' : 'var(--ink-muted)',
                                        }}
                                    />
                                    {open && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* ── Footer ── */}
            <div
                style={{
                    borderTop: '1px solid var(--line)',
                    padding: '8px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {/* Settings */}
                <Link
                    href={route('profile.edit')}
                    prefetch
                    title={!open ? 'Settings' : undefined}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: 'var(--fs-14)',
                        color: 'var(--ink-muted)',
                        transition: 'all 120ms',
                        justifyContent: open ? 'flex-start' : 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)';
                    }}
                >
                    <Settings size={18} style={{ flexShrink: 0 }} />
                    {open && <span>Settings</span>}
                </Link>

                {/* User */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px',
                        borderRadius: 8,
                        justifyContent: open ? 'flex-start' : 'center',
                        overflow: 'hidden',
                    }}
                >
                    {/* Avatar */}
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: 'var(--on-primary)',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 'var(--fs-12)',
                            fontWeight: 600,
                            flexShrink: 0,
                        }}
                        title={open ? undefined : auth.user.name}
                    >
                        {auth.user.avatar
                            ? <img
                                src={`/storage/${auth.user.avatar}`}
                                alt={auth.user.name}
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            : getInitials(auth.user.name)
                        }
                    </div>
                    {open && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 'var(--fs-13)', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {auth.user.name}
                            </p>
                            <p style={{ margin: 0, fontSize: 'var(--fs-11)', color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {auth.user.email}
                            </p>
                        </div>
                    )}
                    {open && (
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 6,
                                color: 'var(--ink-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                            }}
                            title="Log out"
                        >
                            <LogOut size={15} />
                        </Link>
                    )}
                </div>
            </div>
        </aside>
    );
}
