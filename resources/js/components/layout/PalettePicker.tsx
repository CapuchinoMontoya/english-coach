import { usePalette, type Palette } from '@/hooks/use-palette';
import { cn } from '@/lib/utils';

export interface PalettePickerProps {
    className?: string;
}

const SWATCHES: { id: Palette; className: string; label: string }[] = [
    { id: 'cafe', className: 'p-cafe', label: 'Café' },
    { id: 'linen', className: 'p-linen', label: 'Linen' },
    { id: 'spice', className: 'p-spice', label: 'Spice' },
];

export function PalettePicker({ className }: PalettePickerProps) {
    const { palette, setPalette } = usePalette();

    return (
        <div className={cn('palette-picker', className)} role="radiogroup" aria-label="Palette">
            {SWATCHES.map((swatch) => (
                <button
                    key={swatch.id}
                    type="button"
                    role="radio"
                    aria-checked={palette === swatch.id}
                    title={swatch.label}
                    onClick={() => setPalette(swatch.id)}
                    className={cn(swatch.className, palette === swatch.id && 'active')}
                />
            ))}
        </div>
    );
}
