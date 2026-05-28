import { useAppearance } from '@/hooks/use-appearance';
import { IconMoon, IconSun } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
    className?: string;
}

/**
 * Cycles between light and dark mode. If your `use-appearance` hook also
 * exposes "system", adjust the toggle target as you see fit.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
    const { appearance, updateAppearance } = useAppearance();
    const isDark = appearance === 'dark';

    return (
        <button
            type="button"
            className={cn('theme-toggle', className)}
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>
    );
}
