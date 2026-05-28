import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LevelBadge, type CefrLevel } from './LevelBadge';

export interface LessonCardProps {
    title: ReactNode;
    description?: ReactNode;
    level?: CefrLevel;
    durationMinutes?: number;
    /** e.g. "conversation" · "grammar" · "live coach" */
    kind?: string;
    /** Replace the default striped thumb with a custom node */
    thumbnail?: ReactNode;
    /** Background color for the thumb if no custom thumbnail */
    thumbColor?: string;
    /** Letter or symbol rendered large inside the thumb */
    glyph?: ReactNode;
    /** Optional footer line — e.g. "★ 4.8 · 1,240 learners" */
    footer?: ReactNode;
    /** Right-aligned call-to-action label in the footer (default "Start →") */
    cta?: ReactNode;
    onClick?: () => void;
    className?: string;
}

export function LessonCard({
    title,
    description,
    level,
    durationMinutes,
    kind,
    thumbnail,
    thumbColor,
    glyph,
    footer,
    cta = 'Start →',
    onClick,
    className,
}: LessonCardProps) {
    const isDark = !!thumbColor;
    return (
        <article
            className={cn('lesson-card', className)}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            style={onClick ? { cursor: 'pointer' } : undefined}
        >
            <div className="thumb" style={thumbColor ? { background: thumbColor } : undefined}>
                {thumbnail ?? (
                    <>
                        <div
                            className="thumb-pattern"
                            style={
                                isDark
                                    ? {
                                          backgroundImage:
                                              'repeating-linear-gradient(-45deg, transparent 0 8px, oklch(1 0 0 / 0.12) 8px 9px)',
                                      }
                                    : undefined
                            }
                        />
                        {glyph !== undefined && (
                            <div className="thumb-emoji" style={isDark ? { color: 'white' } : undefined}>
                                {glyph}
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="meta">
                {level && <LevelBadge level={level} />}
                {(durationMinutes !== undefined || kind) && (
                    <span className="duration">
                        {durationMinutes !== undefined && `${durationMinutes} min`}
                        {durationMinutes !== undefined && kind && ' · '}
                        {kind}
                    </span>
                )}
            </div>
            <div className="body">
                <h4>{title}</h4>
                {description !== undefined && <p className="desc">{description}</p>}
            </div>
            {(footer !== undefined || cta !== undefined) && (
                <div className="footer">
                    <span>{footer}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{cta}</span>
                </div>
            )}
        </article>
    );
}
