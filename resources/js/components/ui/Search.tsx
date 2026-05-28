import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconSearch } from '@/components/icons';

export interface SearchProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Optional shortcut hint (rendered as a kbd on the trailing edge) */
    shortcut?: ReactNode;
    wrapperClassName?: string;
}

export const Search = forwardRef<HTMLInputElement, SearchProps>(function Search(
    { shortcut, wrapperClassName, className, placeholder = 'Search…', ...rest },
    ref,
) {
    return (
        <div className={cn('search', wrapperClassName)}>
            <IconSearch size={16} />
            <input ref={ref} type="search" placeholder={placeholder} className={className} {...rest} />
            {shortcut !== undefined && <kbd>{shortcut}</kbd>}
        </div>
    );
});
