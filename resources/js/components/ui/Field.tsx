import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FieldProps {
    /** Label text rendered above the control */
    label?: ReactNode;
    /** Helper text rendered below the control */
    hint?: ReactNode;
    /** Error text rendered below the control (replaces hint when present) */
    error?: ReactNode;
    /** ID forwarded to the label's htmlFor */
    htmlFor?: string;
    className?: string;
    children: ReactNode;
}

/**
 * Layout wrapper for a labelled form control. Pair with <Input>, <Textarea>,
 * <Select> etc.
 *
 * @example
 *   <Field label="Email" hint="We'll never share it." htmlFor="email">
 *     <Input id="email" type="email" />
 *   </Field>
 */
export function Field({ label, hint, error, htmlFor, className, children }: FieldProps) {
    return (
        <div className={cn('field', className)}>
            {label !== undefined && (
                <label className="field-label" htmlFor={htmlFor}>
                    {label}
                </label>
            )}
            {children}
            {error !== undefined ? (
                <span className="field-error">{error}</span>
            ) : hint !== undefined ? (
                <span className="field-hint">{hint}</span>
            ) : null}
        </div>
    );
}
