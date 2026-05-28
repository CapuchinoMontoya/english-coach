import { cn } from '@/lib/utils';

export interface ProgressRingProps {
    /** 0–100 */
    value: number;
    size?: number;
    /** Stroke thickness in pixels */
    strokeWidth?: number;
    className?: string;
    'aria-label'?: string;
}

export function ProgressRing({
    value,
    size = 120,
    strokeWidth = 10,
    className,
    'aria-label': ariaLabel = 'Progress',
}: ProgressRingProps) {
    const clamped = Math.min(100, Math.max(0, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;
    const center = size / 2;

    return (
        <svg
            className={cn('progress-ring', className)}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="progressbar"
            aria-label={ariaLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clamped}
        >
            <circle
                className="track"
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
            />
            <circle
                className="bar"
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
            />
        </svg>
    );
}
