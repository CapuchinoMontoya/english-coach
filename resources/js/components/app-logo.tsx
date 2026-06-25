export default function AppLogo({ open = true }: { open?: boolean }) {
    return (
        <>
            <div
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'var(--ink)',
                    color: 'var(--bg)',
                    display: 'inline-grid',
                    placeItems: 'center',
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 20,
                    lineHeight: 1,
                    position: 'relative',
                    flexShrink: 0,
                }}
            >
                <img src="/favicon.ico" alt="Logo del sitio" width="32" height="32" />
                <span
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: 5,
                        right: 6,
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                    }}
                />
            </div>

            {open && (
                <div className="ml-1 grid flex-1 text-left">
                    <span
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic',
                            fontSize: 'var(--fs-18)',
                            lineHeight: 1,
                            color: 'var(--ink)',
                            letterSpacing: '-0.015em',
                        }}
                    >
                        Capuchino
                    </span>
                    <span style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-muted)', lineHeight: 1.3 }}>
                        English Coach
                    </span>
                </div>
            )}
        </>
    );
}