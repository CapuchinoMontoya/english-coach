import { useCallback, useEffect, useState } from 'react';

/**
 * Capuchino — palette controller.
 *
 * Mirrors the `use-appearance` hook pattern: a small typed hook for runtime
 * switching, plus an `initializePalette()` that runs once at boot from app.tsx
 * so the correct palette is applied before first paint (no flash).
 *
 * The palette is read by tokens.css via `[data-palette="..."]` on <html>.
 */

export type Palette = 'cafe' | 'linen' | 'spice';

export const PALETTES: ReadonlyArray<Palette> = ['cafe', 'linen', 'spice'];

const STORAGE_KEY = 'capu.palette';
const DEFAULT_PALETTE: Palette = 'cafe';

/** Type guard for stored values. */
const isPalette = (value: unknown): value is Palette =>
    typeof value === 'string' && (PALETTES as ReadonlyArray<string>).includes(value);

/** Read the saved palette from localStorage, falling back to the default. */
export const getStoredPalette = (): Palette => {
    if (typeof window === 'undefined') return DEFAULT_PALETTE;
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return isPalette(stored) ? stored : DEFAULT_PALETTE;
    } catch {
        return DEFAULT_PALETTE;
    }
};

/** Apply a palette to <html> without persisting it. */
const applyPalette = (palette: Palette): void => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-palette', palette);
};

/**
 * Bootstrap function — call once from app.tsx.
 * Reads the stored palette and applies it before the React tree mounts.
 */
export const initializePalette = (): void => {
    applyPalette(getStoredPalette());
};

/**
 * React hook — use anywhere you want to read or set the active palette
 * (e.g. a settings dropdown, a theme switcher in the topbar).
 *
 * @example
 *   const { palette, setPalette } = usePalette();
 *   <button onClick={() => setPalette('spice')}>Spice</button>
 */
export function usePalette(): {
    palette: Palette;
    setPalette: (next: Palette) => void;
    palettes: ReadonlyArray<Palette>;
} {
    const [palette, setPaletteState] = useState<Palette>(() => getStoredPalette());

    const setPalette = useCallback((next: Palette) => {
        setPaletteState(next);
        applyPalette(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // ignore (private mode / quota)
        }
    }, []);

    // Keep multiple tabs / windows in sync.
    useEffect(() => {
        const onStorage = (event: StorageEvent): void => {
            if (event.key !== STORAGE_KEY) return;
            const next = isPalette(event.newValue) ? event.newValue : DEFAULT_PALETTE;
            setPaletteState(next);
            applyPalette(next);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return { palette, setPalette, palettes: PALETTES };
}
