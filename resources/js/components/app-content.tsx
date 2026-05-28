import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'div'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ children, ...props }: AppContentProps) {
    return (
        <main
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            {...props}
        >
            {children}
        </main>
    );
}
