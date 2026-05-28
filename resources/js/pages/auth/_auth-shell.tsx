import { Link } from '@inertiajs/react';
import { ReactNode } from 'react';

interface WordOfDay {
    word: string;
    pron: string;
    pos: string;
    defn: string;
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

interface AuthShellProps {
    children: ReactNode;
    eyebrow: string;
    heading: ReactNode;
    sub: string;
    quote?: string;
    word?: WordOfDay;
}

export function AuthShell({ children, eyebrow, heading, sub, quote, word }: AuthShellProps) {
    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: AUTH_STYLES }} />
            <div className="auth">
                {/* ===== LEFT: editorial brand panel ===== */}
                <aside className="auth__brand">
                    <div className="brand-top">
                        <Link href="/" className="wordmark" aria-label="Capuchino home">
                            Capuchino<span className="dot" />
                        </Link>
                    </div>

                    <div className="brand-stamp" aria-hidden="true">
                        <span>Daily</span>
                        <span className="big">ritual</span>
                        <span>Est. {new Date().getFullYear()}</span>
                    </div>

                    <div className="brand-quote">
                        <span className="mark" aria-hidden="true">"</span>
                        <p className="words">{quote ?? 'A new word, served warm every morning.'}</p>
                        <div className="attrib">The Capuchino promise</div>
                    </div>

                    {word && (
                        <div className="word-card" aria-label="Today's word">
                            <span className={`level ${word.level.toLowerCase()} lvl`} style={{ fontWeight: 600 }}>
                                {word.level}
                            </span>
                            <div className="label">Word of the day</div>
                            <div className="word">{word.word}</div>
                            <div className="pron">{word.pron} &nbsp;·&nbsp; {word.pos}</div>
                            <div className="defn">{word.defn}</div>
                        </div>
                    )}

                    <div className="brand-foot">
                        <span>© {new Date().getFullYear()} Capuchino Co.</span>
                        <div className="row">
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                            <a href="#">Help</a>
                        </div>
                    </div>
                </aside>

                {/* ===== RIGHT: form panel ===== */}
                <section className="auth__form">
                    <div className="form-top">
                        <span className="availability">
                            <span className="pulse" />
                            All systems warm
                        </span>
                    </div>

                    <div className="form-shell">
                        <span className="eyebrow">
                            <span className="pip" />
                            {eyebrow}
                        </span>
                        <h1 className="display">{heading}</h1>
                        <p className="sub">{sub}</p>

                        <div style={{ marginTop: 'var(--s-7)' }}>
                            {children}
                        </div>
                    </div>

                    <div className="form-foot">
                        <span>v1.0</span>
                        <div className="row">
                            <a href="#">EN · English</a>
                            <a href="#">Status</a>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

const AUTH_STYLES = `
html, body { height: 100%; }
body { overflow-x: hidden; }

.auth {
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    min-height: 100vh;
}

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
    background-image: repeating-linear-gradient(45deg, transparent 0 14px, oklch(from var(--ink) l c h / 0.035) 14px 15px);
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
.brand-foot a { color: var(--ink-muted); }
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

.auth__form {
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
    .auth__form { padding: var(--s-7) var(--s-5); }
}

.form-top {
    display: flex; align-items: center; justify-content: space-between;
}
.form-shell {
    margin: auto 0;
    width: 100%;
    max-width: 420px;
    padding: var(--s-7) 0;
}
.form-shell .eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
}
.form-shell .eyebrow .pip {
    width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
    display: inline-block;
}
.form-shell h1.display {
    font-size: clamp(2.4rem, 4.2vw, 3.4rem);
    margin-top: var(--s-3);
    max-width: 14ch;
}
.form-shell .sub {
    margin-top: var(--s-3);
    color: var(--ink-muted);
    font-size: var(--fs-15);
    max-width: 38ch;
    line-height: 1.55;
}

.password-wrap { position: relative; }
.password-wrap .reveal {
    position: absolute; right: 10px; top: 50%;
    transform: translateY(-50%);
    width: 30px; height: 30px; border-radius: 50%;
    display: grid; place-items: center; color: var(--ink-subtle);
    background: transparent; border: none; cursor: pointer;
}
.password-wrap .reveal:hover { color: var(--ink); background: var(--bg-sunken); }

.word-card {
    position: relative;
    margin-top: var(--s-7);
    padding: var(--s-5);
    background: var(--bg-elevated);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-sm);
    max-width: 360px;
}
.word-card .label {
    font-family: var(--font-mono); font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--ink-subtle);
    display: flex; align-items: center; gap: 8px;
}
.word-card .label::before {
    content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
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
    margin-top: 10px; font-size: var(--fs-13); color: var(--ink-muted); line-height: 1.5;
}
.word-card .lvl {
    position: absolute; top: var(--s-4); right: var(--s-4);
}

.availability {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 4px 10px 4px 8px;
    background: var(--success-soft, #dcfce7);
    color: var(--success, #166534);
    border-radius: var(--r-pill);
    font-size: var(--fs-12); font-weight: 500;
}
.availability .pulse {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--success, #16a34a); position: relative;
}
.availability .pulse::after {
    content: ""; position: absolute; inset: -3px; border-radius: 50%;
    border: 1px solid var(--success, #16a34a); opacity: 0.5;
    animation: ping 1.8s var(--ease) infinite;
}
@keyframes ping {
    0% { transform: scale(0.6); opacity: 0.6; }
    100% { transform: scale(1.8); opacity: 0; }
}

.form-foot {
    margin-top: auto;
    display: flex; align-items: center; justify-content: space-between;
    font-size: var(--fs-12);
    color: var(--ink-subtle);
    padding-top: var(--s-5);
}
.form-foot .row { gap: var(--s-5); display: flex; }
.form-foot a { color: var(--ink-subtle); }
.form-foot a:hover { color: var(--ink); text-decoration: none; }
`;
