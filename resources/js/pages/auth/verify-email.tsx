import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, Mail } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/Alert';
import { LanguageToggle } from '@/components/LanguageToggle';
import { AUTH_STRINGS, useLocale } from '@/lib/auth-i18n';
import { AuthShell } from './_auth-shell';

interface VerificationState {
    wait: number;
    attempts_left: number;
    max_attempts: number;
    blocked: boolean;
}

/** Segundos a "1:05" o "47s". */
function formatWait(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VerifyEmail({
    status,
    verificationState,
}: {
    status?: string;
    verificationState?: VerificationState;
}) {
    const { post, processing } = useForm({});
    const [locale, setLocale] = useLocale();
    const strings = AUTH_STRINGS[locale];
    const t = strings.verify;

    const state: VerificationState = verificationState ?? {
        wait: 0,
        attempts_left: 3,
        max_attempts: 3,
        blocked: false,
    };

    // Cuenta regresiva local. El servidor es quien manda — esto solo evita que el
    // usuario gaste un intento en un clic que de todos modos iba a rebotar.
    const [wait, setWait] = useState(state.wait);

    useEffect(() => setWait(state.wait), [state.wait, status]);

    useEffect(() => {
        if (wait <= 0) return;
        const id = window.setInterval(() => setWait(w => (w <= 1 ? 0 : w - 1)), 1000);
        return () => window.clearInterval(id);
    }, [wait]);

    const blocked = state.blocked;
    const waiting = wait > 0;
    const canResend = !processing && !waiting && !blocked;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!canResend) return;
        post(route('verification.send'));
    };

    const label = blocked ? t.tooMany : waiting ? t.resendIn(formatWait(wait)) : t.resend;

    return (
        <>
            <Head title={t.headTitle} />
            <AuthShell
                eyebrow={t.eyebrow}
                heading={<>{t.titlePre}<em style={{ color: 'var(--accent)' }}>{t.titleEm}</em>{t.titlePost}</>}
                sub={t.sub}
                quote={t.quote}
                word={{ word: 'verify', pron: '/ˈver.ɪ.faɪ/', pos: 'verb', defn: t.wordDefn, level: 'B2' }}
            >
                {status === 'verification-link-sent' && (
                    <Alert tone="success" className="mb-5">{t.sentAlert}</Alert>
                )}

                {status === 'verification-link-failed' && (
                    <Alert tone="danger" className="mb-5">{t.failedAlert}</Alert>
                )}

                {status === 'verification-link-throttled' && (
                    <Alert tone="warning" className="mb-5">{t.throttledAlert}</Alert>
                )}

                {blocked && (
                    <Alert tone="danger" className="mb-5">
                        {t.blockedAlert(state.max_attempts, formatWait(wait))}
                    </Alert>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', alignItems: 'center', textAlign: 'center' }}>
                    <p style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-muted)', lineHeight: 1.6, maxWidth: '36ch' }}>
                        {t.didntGet}
                    </p>

                    <form onSubmit={submit}>
                        <Button
                            type="submit"
                            variant="secondary"
                            size="lg"
                            disabled={!canResend}
                            leadingIcon={processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail size={16} />}
                        >
                            {label}
                        </Button>
                    </form>

                    {!blocked && (
                        <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-subtle)' }}>
                            {t.attemptsLeft(state.attempts_left, state.max_attempts)}
                            {waiting && ` · ${t.onePerMinute}`}
                        </p>
                    )}

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-subtle)', marginTop: 'var(--s-3)' }}
                    >
                        {t.logoutOther}
                    </Link>

                    <div style={{ marginTop: 'var(--s-4)' }}>
                        <LanguageToggle locale={locale} onChange={setLocale} label={strings.languageLabel} />
                    </div>
                </div>
            </AuthShell>
        </>
    );
}
