import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    children?: ReactNode;
    /** Wrapper className (applies to the <label>) */
    wrapperClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
    { children, wrapperClassName, className, ...rest },
    ref,
) {
    return (
        <label className={cn('check', wrapperClassName)}>
            <input ref={ref} type="checkbox" className={className} {...rest} />
            <span className="box" />
            {children !== undefined && <span>{children}</span>}
        </label>
    );
});
