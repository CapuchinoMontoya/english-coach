/**
 * Tiny className composer.
 *
 * Accepts strings, falsy values (null/undefined/false), and objects whose
 * truthy keys are emitted. Returns a single space-separated string.
 *
 * @example
 *   cn('btn', size === 'sm' && 'btn-sm', { 'btn-primary': variant === 'primary' })
 */
export type ClassValue =
    | string
    | number
    | null
    | undefined
    | false
    | { [key: string]: boolean | null | undefined };

export function cn(...inputs: ClassValue[]): string {
    const out: string[] = [];
    for (const input of inputs) {
        if (!input && input !== 0) continue;
        if (typeof input === 'string' || typeof input === 'number') {
            out.push(String(input));
        } else if (typeof input === 'object') {
            for (const key in input) {
                if (input[key]) out.push(key);
            }
        }
    }
    return out.join(' ');
}
