import { type HTMLAttributes, type ReactNode, type TableHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Capuchino table primitives. Thin wrappers that apply the design system's
 * table styling while letting you compose rows however you like.
 *
 * @example
 *   <Table>
 *     <THead><TR><TH>Lesson</TH><TH>Level</TH></TR></THead>
 *     <TBody>
 *       <TR><TD>The art of small talk</TD><TD>A2</TD></TR>
 *     </TBody>
 *   </Table>
 */
export function Table({ className, children, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
    return (
        <table className={cn('table', className)} {...rest}>
            {children}
        </table>
    );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
    return <thead {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody {...props} />;
}

export function TR(props: HTMLAttributes<HTMLTableRowElement>) {
    return <tr {...props} />;
}

export function TH({
    children,
    ...rest
}: HTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
    return <th {...rest}>{children}</th>;
}

export function TD({
    children,
    ...rest
}: HTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
    return <td {...rest}>{children}</td>;
}
