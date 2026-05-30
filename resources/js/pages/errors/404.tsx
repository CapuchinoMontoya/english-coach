import { Head, Link } from '@inertiajs/react';

const wordOfTheDay = {
    word: "found",
    pronunciation: "/faʊnd/",
    level: "A1",
    meanings: [
        {
            type: "verb (past of find)",
            definition: "To discover or locate something that was lost, hidden, or unknown.",
        },
        {
            type: "verb",
            definition: "To establish or set up an institution, organization, or settlement.",
        },
        {
            type: "adjective",
            definition: "Discovered by chance or unexpectedly; encountered serendipitously.",
        },
    ],
};

const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

export default function Error404() {
    return (
        <>
            <Head title="404 — Page not found" />
            <style dangerouslySetInnerHTML={{
                __html: `
                html, body { height: 100%; }
                body { overflow-x: hidden; }

                .auth {
                    display: grid;
                    grid-template-columns: 1.05fr 1fr;
                    min-height: 100vh;
                }

                /* ===== LEFT: editorial brand panel ===== */
                .auth__brand {
                    position: relative;
                    background: var(--bg-sunken);
                    color: var(--ink);
                    padding: var(--s-9) var(--s-9) var(--s-7);
                    display: flex; flex-direction: column;
                    overflow: hidden;
                    border-right: 1px solid var(--line-subtle);
                }
                .auth__brand::before {
                    content: "";
                    position: absolute; inset: 0;
                    background-image:
                        repeating-linear-gradient(45deg,
                        transparent 0 14px,
                        oklch(from var(--ink) l c h / 0.035) 14px 15px);
                    pointer-events: none;
                }
                .brand-top {
                    position: relative;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .brand-back {
                    display: inline-flex; align-items: center; gap: 8px;
                    color: var(--ink-muted); font-size: var(--fs-13);
                    padding: 6px 10px; border-radius: var(--r-pill);
                    transition: color 0.2s, background 0.2s;
                }
                .brand-back:hover { color: var(--ink); background: var(--bg-elevated); text-decoration: none; }

                .brand-quote {
                    position: relative;
                    margin-top: auto;
                    max-width: 28ch;
                }
                .brand-quote .mark {
                    font-family: var(--font-display);
                    font-style: italic;
                    font-size: 140px;
                    line-height: 0.7;
                    color: var(--accent);
                    display: block;
                    height: 64px;
                }
                .brand-quote .words {
                    font-family: var(--font-display);
                    font-style: italic;
                    font-weight: 400;
                    font-size: clamp(2.4rem, 3.6vw, 3.4rem);
                    line-height: 1.05;
                    letter-spacing: -0.012em;
                    color: var(--ink);
                    margin-top: -8px;
                    text-wrap: pretty;
                }
                .brand-quote .attrib {
                    margin-top: var(--s-5);
                    font-family: var(--font-mono);
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: var(--ink-subtle);
                    display: flex; align-items: center; gap: 10px;
                }
                .brand-quote .attrib::before {
                    content: ""; width: 28px; height: 1px; background: var(--ink-subtle);
                }

                .brand-foot {
                    position: relative;
                    margin-top: var(--s-9);
                    display: flex; align-items: center; justify-content: space-between;
                    border-top: 1px solid var(--line);
                    padding-top: var(--s-5);
                    font-size: var(--fs-13);
                    color: var(--ink-muted);
                }
                .brand-foot .row { gap: var(--s-5); display: flex; }
                .brand-foot a { color: var(--ink-muted); transition: color 0.2s; }
                .brand-foot a:hover { color: var(--ink); text-decoration: none; }

                .brand-stamp {
                    position: absolute;
                    top: var(--s-9);
                    right: var(--s-9);
                    width: 96px; height: 96px;
                    border-radius: 50%;
                    border: 1px dashed var(--line-strong);
                    display: grid; place-items: center;
                    font-family: var(--font-mono); font-size: 10px;
                    text-transform: uppercase; letter-spacing: 0.18em;
                    color: var(--ink-muted);
                    text-align: center;
                    transform: rotate(-8deg);
                }
                .brand-stamp span { display: block; line-height: 1.5; }
                .brand-stamp .big {
                    font-family: var(--font-display); font-style: italic;
                    font-size: 22px; color: var(--accent); letter-spacing: 0;
                    margin: 2px 0;
                }

                /* ===== RIGHT: 404 error panel ===== */
                .auth__error {
                    background: var(--bg);
                    padding: var(--s-9) var(--s-9);
                    display: flex; flex-direction: column;
                    position: relative;
                }
                @media (max-width: 940px) {
                    .auth { grid-template-columns: 1fr; }
                    .auth__brand { display: none; }
                }
                @media (max-width: 540px) {
                    .auth__error { padding: var(--s-7) var(--s-5); }
                }

                .error-top {
                    display: flex; align-items: center; justify-content: space-between;
                }
                .error-shell {
                    margin: auto 0;
                    width: 100%;
                    max-width: 460px;
                    padding: var(--s-7) 0;
                }
                .error-shell .eyebrow {
                    display: inline-flex; align-items: center; gap: 8px;
                    font-family: var(--font-mono);
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: var(--ink-muted);
                }
                .error-shell .eyebrow .pip {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: var(--danger, #dc2626);
                    display: inline-block;
                    animation: blink-pip 2s ease-in-out infinite;
                }
                @keyframes blink-pip {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .error-number {
                    font-family: var(--font-display);
                    font-style: italic;
                    font-size: clamp(7rem, 11vw, 10rem);
                    line-height: 0.85;
                    letter-spacing: -0.025em;
                    color: var(--ink);
                    margin-top: var(--s-2);
                    user-select: none;
                }
                .error-number .zero-wrap {
                    position: relative;
                    display: inline-block;
                }
                .error-number .zero-wrap::after {
                    content: "";
                    position: absolute;
                    inset: -12px -8px;
                    border: 2.5px dashed var(--line-strong);
                    border-radius: 50%;
                    opacity: 0.45;
                    animation: spin-slow 20s linear infinite;
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .error-shell h1 {
                    font-family: var(--font-display);
                    font-style: italic;
                    font-size: clamp(2rem, 3.2vw, 2.8rem);
                    letter-spacing: -0.012em;
                    margin-top: var(--s-2);
                    color: var(--ink);
                    max-width: 16ch;
                }
                .error-shell .sub {
                    margin-top: var(--s-3);
                    color: var(--ink-muted);
                    font-size: var(--fs-15);
                    max-width: 40ch;
                    line-height: 1.6;
                }
                .error-shell .sub em {
                    font-style: italic;
                    color: var(--accent);
                    font-weight: 500;
                }

                /* Word card (in error panel) */
                .word-card {
                    position: relative;
                    margin-top: var(--s-6);
                    padding: var(--s-5) var(--s-5);
                    background: var(--bg-elevated);
                    border: 1px solid var(--line);
                    border-radius: var(--r-lg);
                    box-shadow: var(--shadow-sm);
                }
                .word-card .label {
                    font-family: var(--font-mono); font-size: 11px;
                    text-transform: uppercase; letter-spacing: 0.14em;
                    color: var(--ink-subtle);
                    display: flex; align-items: center; gap: 8px;
                }
                .word-card .label::before {
                    content: ""; width: 6px; height: 6px; border-radius: 50%;
                    background: var(--accent);
                }
                .word-card .word {
                    font-family: var(--font-display); font-style: italic;
                    font-size: 40px; line-height: 1; letter-spacing: -0.01em;
                    margin-top: 10px; color: var(--ink);
                }
                .word-card .pron {
                    font-family: var(--font-mono); font-size: var(--fs-13);
                    color: var(--ink-muted); margin-top: 6px;
                }
                .word-card .defn {
                    margin-top: 8px; font-size: var(--fs-13);
                    color: var(--ink-muted); line-height: 1.5;
                }
                .word-card .meaning-type {
                    font-family: var(--font-mono);
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--ink-subtle);
                    margin-top: 10px;
                    margin-bottom: 2px;
                }
                .word-card .lvl {
                    position: absolute; top: var(--s-4); right: var(--s-4);
                }

                /* CTA button */
                .error-cta {
                    display: inline-flex; align-items: center; gap: 10px;
                    margin-top: var(--s-6);
                    padding: 14px 28px;
                    background: var(--ink);
                    color: var(--bg);
                    font-family: var(--font-mono);
                    font-size: var(--fs-13);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border-radius: var(--r-pill);
                    border: none;
                    cursor: pointer;
                    transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
                    text-decoration: none;
                }
                .error-cta:hover {
                    background: var(--accent);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px oklch(from var(--accent) l c h / 0.25);
                    text-decoration: none;
                    color: var(--bg);
                }
                .error-cta .arrow {
                    transition: transform 0.25s;
                    font-size: 18px;
                    line-height: 1;
                }
                .error-cta:hover .arrow {
                    transform: translateX(4px);
                }

                /* Error footer */
                .error-foot {
                    margin-top: auto;
                    display: flex; align-items: center; justify-content: space-between;
                    font-size: var(--fs-12);
                    color: var(--ink-subtle);
                    padding-top: var(--s-5);
                    border-top: 1px solid var(--line);
                }
                .error-foot .row { gap: var(--s-5); display: flex; }
                .error-foot a { color: var(--ink-subtle); transition: color 0.2s; }
                .error-foot a:hover { color: var(--ink); text-decoration: none; }

                /* Level badge */
                .level-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 3px 10px;
                    background: var(--bg-sunken);
                    border: 1px solid var(--line);
                    border-radius: var(--r-pill);
                    font-family: var(--font-mono);
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--ink-muted);
                    font-weight: 600;
                }
            `}} />

            <div className="auth">
                {/* ============================================================
                     LEFT — editorial brand panel
                     ============================================================ */}
                <aside className="auth__brand">
                    <div className="brand-top">
                        <Link href="/" className="wordmark" aria-label="Capuchino home">
                            Capuchino<span className="dot"></span>
                        </Link>
                    </div>

                    {/* Stamp: Lost & Found */}
                    <div className="brand-stamp" aria-hidden="true">
                        <span>Lost</span>
                        <span className="big">&amp;</span>
                        <span>Found</span>
                    </div>

                    {/* Brand quote */}
                    <div className="brand-quote">
                        <span className="mark" aria-hidden="true">“</span>
                        <p className="words">
                            Some pages go missing. But every lost word has its day.
                        </p>
                        <span className="mark" aria-hidden="true">”</span>
                        <div className="attrib">The Capuchino promise</div>
                    </div>

                    {/* Brand footer */}
                    <div className="brand-foot">
                        <span>© {new Date().getFullYear()} Capuchino Co.</span>
                        <div className="row">
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                            <a href="#">Help</a>
                        </div>
                    </div>
                </aside>

                {/* ============================================================
                     RIGHT — 404 error panel
                     ============================================================ */}
                <main className="auth__error">
                    {/* Top row — subtle status indicator */}
                    <div className="error-top">
                        <span className="level-badge">HTTP 404</span>
                    </div>

                    {/* Error content */}
                    <div className="error-shell">
                        {/* Eyebrow */}
                        <div className="eyebrow">
                            <span className="pip" aria-hidden="true"></span>
                            Error
                        </div>

                        {/* Big 404 — zero wrapped for dashed-ring effect */}
                        <div className="error-number">
                            4<span className="zero-wrap">0</span>4
                        </div>

                        {/* Heading */}
                        <h1>Page not found</h1>

                        {/* Subtitle — ironic tie-in */}
                        <p className="sub">
                            The page you're looking for doesn't exist, has been moved, or never was.
                            Ironically, today's word of the day is <em>found</em>.
                            The universe has a sense of humor.
                        </p>

                        {/* Word of the day card: "found" */}
                        <div className="word-card" aria-label="Today's word">
                            <span className="level-badge lvl">{wordOfTheDay.level}</span>
                            <div className="label">Word of the day · {dayOfWeek}</div>
                            <div className="word">{wordOfTheDay.word}</div>
                            <div className="pron">{wordOfTheDay.pronunciation}</div>
                            {wordOfTheDay.meanings.map((meaning, index) => (
                                <div key={index}>
                                    <div className="meaning-type">{meaning.type}</div>
                                    <div className="defn">{meaning.definition}</div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <Link href="/" className="error-cta">
                            Find your way home
                            <span className="arrow" aria-hidden="true">→</span>
                        </Link>
                    </div>

                    {/* Error footer */}
                    <div className="error-foot">
                        <span>© {new Date().getFullYear()} Capuchino Co.</span>
                        <div className="row">
                            <Link href="/">Home</Link>
                            <a href="#">Contact</a>
                            <a href="#">Status</a>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}