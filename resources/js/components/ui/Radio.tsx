import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    children?: ReactNode;
    wrapperClassName?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
    { children, wrapperClassName, className, ...rest },
    ref,
) {
    return (
        <label className={cn('check radio', wrapperClassName)}>
            <input ref={ref} type="radio" className={className} {...rest} />
            <span className="box" />
            {children !== undefined && <span>{children}</span>}
        </label>
    );
});
