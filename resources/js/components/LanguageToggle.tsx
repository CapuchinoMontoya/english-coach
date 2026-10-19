import type { ReactElement } from 'react'
import { LOCALES, type Locale } from '@/lib/auth-i18n'
import './LanguageToggle.css'

/* ─── Banderas en SVG ──────────────────────────────────────────────────────────
   No usamos emoji (🇲🇽/🇺🇸) porque Windows no trae las banderas en su fuente y
   las dibuja como las letras "MX"/"US". En SVG se ven bien en todos lados.
   ─────────────────────────────────────────────────────────────────────────── */

function FlagUS({ size = 16 }: { size?: number }) {
    const h = Math.round((size * 11) / 16)
    return (
        <svg width={size} height={h} viewBox="0 0 22 15" aria-hidden="true" className="lang-flag">
            <clipPath id="lt-us-clip"><rect width="22" height="15" rx="2.2" /></clipPath>
            <g clipPath="url(#lt-us-clip)">
                <rect width="22" height="15" fill="#F7F7F7" />
                {[0, 2, 4, 6, 8, 10, 12].map(y => (
                    <rect key={y} y={y + 0.15} width="22" height="1.15" fill="#D62B38" />
                ))}
                <rect width="10" height="8.3" fill="#2C3E7B" />
                {[1.4, 3.6, 5.8].map(y =>
                    [1.3, 3.3, 5.3, 7.3].map(x => (
                        <circle key={`${x}-${y}`} cx={x + 0.5} cy={y} r="0.52" fill="#F7F7F7" />
                    ))
                )}
            </g>
            <rect width="22" height="15" rx="2.2" fill="none" stroke="rgba(0,0,0,.16)" strokeWidth="0.8" />
        </svg>
    )
}

function FlagMX({ size = 16 }: { size?: number }) {
    const h = Math.round((size * 11) / 16)
    return (
        <svg width={size} height={h} viewBox="0 0 22 15" aria-hidden="true" className="lang-flag">
            <clipPath id="lt-mx-clip"><rect width="22" height="15" rx="2.2" /></clipPath>
            <g clipPath="url(#lt-mx-clip)">
                <rect width="7.34" height="15" fill="#006847" />
                <rect x="7.34" width="7.33" height="15" fill="#F7F7F7" />
                <rect x="14.67" width="7.33" height="15" fill="#CE1126" />
                {/* El escudo, simplificado: distingue a México de la bandera de Italia */}
                <circle cx="11" cy="7.5" r="2" fill="none" stroke="#7B5B2F" strokeWidth="0.75" />
                <circle cx="11" cy="7.5" r="0.75" fill="#7B5B2F" />
            </g>
            <rect width="22" height="15" rx="2.2" fill="none" stroke="rgba(0,0,0,.16)" strokeWidth="0.8" />
        </svg>
    )
}

const FLAGS: Record<Locale, (p: { size?: number }) => ReactElement> = {
    en: FlagUS,
    es: FlagMX,
}

/**
 * Selector de idioma compacto. Muestra ambas opciones con su bandera para que
 * el idioma activo se vea de un golpe y cambiar sea un solo clic.
 */
export function LanguageToggle({
    locale,
    onChange,
    label,
}: {
    locale: Locale
    onChange: (l: Locale) => void
    label?: string
}) {
    return (
        <div className="lang-toggle" role="group" aria-label={label ?? 'Language'}>
            {LOCALES.map(l => {
                const Flag = FLAGS[l.code]
                const active = l.code === locale
                return (
                    <button
                        key={l.code}
                        type="button"
                        className={`lang-opt ${active ? 'active' : ''}`}
                        onClick={() => onChange(l.code)}
                        aria-pressed={active}
                        title={l.name}
                    >
                        <Flag size={16} />
                        <span className="lang-code">{l.short}</span>
                        <span className="lang-name">{l.name}</span>
                    </button>
                )
            })}
        </div>
    )
}

export default LanguageToggle
