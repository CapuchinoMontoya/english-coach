import type { SVGProps } from 'react';

/**
 * Capuchino — icon set.
 * Stroked, 1.8–2px weight, line-cap round. Inherits color via `currentColor`.
 * Size with the `size` prop or pass width/height yourself.
 */

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
    size?: number | string;
};

const baseProps = (size: number | string = 18): SVGProps<SVGSVGElement> => ({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
});

export function IconPlay({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest} fill="currentColor" stroke="none">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}

export function IconChevronDown({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

export function IconMore({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest}>
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    );
}

export function IconMail({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    );
}

export function IconSearch({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest} strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

export function IconCheck({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest} strokeWidth={2.5}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

export function IconClose({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest} strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

export function IconInfo({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest} strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}

export function IconCheckCircle({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest} strokeWidth={2}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

export function IconAlertTriangle({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest} strokeWidth={2}>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

export function IconAlertCircle({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest} strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    );
}

export function IconFlame({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest} fill="currentColor" strokeWidth={0}>
            <path d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-3-1-3s2 0 3 3a6 6 0 1 1-12 0c0-4 4-6 6-9z" />
        </svg>
    );
}

export function IconMoon({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

export function IconSun({ size, ...rest }: IconProps) {
    return (
        <svg {...baseProps(size)} {...rest}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    );
}
