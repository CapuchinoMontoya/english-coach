import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Eye, EyeOff, LoaderCircle, ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/input-temp';

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    invitation_code: string;
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        invitation_code: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Create an account" />

            <style dangerouslySetInnerHTML={{ __html: `
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

                /* ===== RIGHT: form panel ===== */
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
                    max-width: 12ch;
                }
                .form-shell .sub {
                    margin-top: var(--s-3);
                    color: var(--ink-muted);
                    font-size: var(--fs-15);
                    max-width: 38ch;
                    line-height: 1.55;
                }

                /* Social row */
                .social-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--s-3);
                    margin-top: var(--s-6);
                }
                .social-row svg { width: 18px; height: 18px; }

                .divider {
                    display: flex; align-items: center; gap: var(--s-3);
                    margin: var(--s-5) 0;
                    font-family: var(--font-mono);
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: var(--ink-subtle);
                }
                .divider::before, .divider::after {
                    content: ""; flex: 1; height: 1px; background: var(--line);
                }

                /* Form */
                form.login { display: flex; flex-direction: column; gap: var(--s-5); }
                .row-between { display: flex; align-items: center; justify-content: space-between; width: 100%; }
                .row-between a { font-size: var(--fs-13); color: var(--ink-muted); }
                .row-between a:hover { color: var(--ink); text-decoration: none; }

                .password-wrap { position: relative; }
                .password-wrap .reveal {
                    position: absolute; right: 10px; top: 50%;
                    transform: translateY(-50%);
                    width: 30px; height: 30px; border-radius: 50%;
                    display: grid; place-items: center; color: var(--ink-subtle);
                    background: transparent; border: none; cursor: pointer;
                }
                .password-wrap .reveal:hover { color: var(--ink); background: var(--bg-sunken); }

                .submit-row { margin-top: var(--s-2); }
                .submit-row .btn { width: 100%; }

                .signup-line {
                    text-align: center;
                    font-size: var(--fs-14);
                    color: var(--ink-muted);
                    margin-top: var(--s-7);
                }
                .signup-line a {
                    color: var(--ink);
                    font-weight: 500;
                    border-bottom: 1px solid var(--line-strong);
                    padding-bottom: 1px;
                }
                .signup-line a:hover { color: var(--accent); border-color: var(--accent); text-decoration: none; }

                /* Form footer */
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

                /* Decorative card */
                .word-card {
                    position: relative;
                    margin-top: var(--s-7);
                    padding: var(--s-5) var(--s-5);
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
            `}} />

            <div className="auth">
                <aside className="auth__brand">
                    <div className="brand-top">
                        <Link href="/" className="wordmark" aria-label="Capuchino home">
                            Capuchino<span className="dot"></span>
                        </Link>
                    </div>

                    <div className="brand-stamp" aria-hidden="true">
                        <span>Daily</span>
                        <span className="big">ritual</span>
                        <span>Est. 2024</span>
                    </div>

                    <div className="brand-quote">
                        <span className="mark" aria-hidden="true">“</span>
                        <p className="words">A new word, served warm every morning.</p>
                        <div className="attrib">The Capuchino promise</div>
                    </div>

                    <div className="word-card" aria-label="Today's word">
                        <span className="level a2 lvl" style={{ fontWeight: 600 }}>A2</span>
                        <div className="label">Word of the day · Wed</div>
                        <div className="word">embark</div>
                        <div className="pron">/ɪmˈbɑːrk/ &nbsp;·&nbsp; verb</div>
                        <div className="defn">To start something new or important; to go onto a ship.</div>
                    </div>

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
                     RIGHT — form panel
                     ============================================================ */}
                <section className="auth__form">
                    <div className="form-top">
                        <span className="availability">
                            <span className="pulse"></span>
                            Registrations open
                        </span>
                        <div className="row" style={{ alignItems: 'center', gap: 'var(--s-3)' }}>
                            <span className="ink-subtle small" style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-subtle)' }}>
                                Already have an account?
                            </span>
                            <Link href={route('login')}>
                                <Button variant="secondary" size="sm">Log in</Button>
                            </Link>
                        </div>
                    </div>

                    <div className="form-shell">
                        <span className="eyebrow"><span className="pip"></span>Join the club</span>
                        <h1 className="display">Brew your first <em style={{ color: 'var(--accent)' }}>cup</em>.</h1>
                        <p className="sub">Create an account to start your daily English ritual and track your progress.</p>

                        <div className="social-row">
                            <a href="/auth/google" className="w-full" style={{ display: 'contents' }}>
                                <Button variant="secondary" type="button" className="w-full">
                                    <GoogleIcon /> Sign up with Google
                                </Button>
                            </a>
                            <Button variant="secondary" type="button" className="w-full" disabled>
                                <AppleIcon /> Sign up with Apple
                            </Button>
                        </div>

                        <div className="divider">or register with email</div>

                        <form className="login" onSubmit={submit}>
                            {/* NAME */}
                            <Field label="Full Name" htmlFor="name" error={errors.name}>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    placeholder="Jane Doe"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    invalid={!!errors.name}
                                    disabled={processing}
                                />
                            </Field>

                            {/* EMAIL */}
                            <Field label="Email address" htmlFor="email" error={errors.email}>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    invalid={!!errors.email}
                                    disabled={processing}
                                />
                            </Field>

                            {/* INVITATION CODE */}
                            <Field label="Invitation Code" htmlFor="invitation_code" error={errors.invitation_code}>
                                <Input
                                    id="invitation_code"
                                    type="text"
                                    required
                                    tabIndex={3}
                                    autoComplete="off"
                                    placeholder="e.g. KPUCOFFE20"
                                    value={data.invitation_code}
                                    onChange={(e) => setData('invitation_code', e.target.value.toUpperCase())}
                                    invalid={!!errors.invitation_code}
                                    disabled={processing}
                                />
                            </Field>

                            {/* PASSWORD */}
                            <Field htmlFor="password" error={errors.password} label="Password">
                                <div className="password-wrap">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        tabIndex={4}
                                        autoComplete="new-password"
                                        placeholder="Create a strong password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        invalid={!!errors.password}
                                        disabled={processing}
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        className="reveal"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </Field>

                            {/* CONFIRM PASSWORD */}
                            <Field htmlFor="password_confirmation" error={errors.password_confirmation} label="Confirm Password">
                                <div className="password-wrap">
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        tabIndex={5}
                                        autoComplete="new-password"
                                        placeholder="Confirm your password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        invalid={!!errors.password_confirmation}
                                        disabled={processing}
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        className="reveal"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </Field>

                            <div className="submit-row">
                                <Button
                                    type="submit"
                                    size="lg"
                                    tabIndex={6}
                                    disabled={processing}
                                    className="w-full"
                                    trailingIcon={
                                        processing ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ArrowRight size={16} />
                                        )
                                    }
                                >
                                    Create account
                                </Button>
                            </div>
                        </form>

                        <p className="signup-line">
                            Already a member?{' '}
                            <Link href={route('login')}>Log in here →</Link>
                        </p>
                    </div>

                    <div className="form-foot">
                        <span>v1.0 · Updated 2 days ago</span>
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

/* ---------- inline icon SVGs ---------- */

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.3 12 2.3c-5.4 0-9.7 4.4-9.7 9.8s4.3 9.8 9.7 9.8c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"
            />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.7-3-2-3.7-2-1.6-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.6 1.3-.1 1.8-.9 3.4-.9s2 .9 3.4.8c1.4 0 2.3-1.2 3.1-2.5.9-1.5 1.4-2.9 1.4-2.9-.1 0-2.7-1-2.7-3.9zM13.9 4.8c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.3.7-3 1.6-.6.8-1.2 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z" />
        </svg>
    );
}