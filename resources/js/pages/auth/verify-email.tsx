import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, Mail } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/Alert';
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

    const label = blocked
        ? 'Too many attempts'
        : waiting
          ? `Resend in ${formatWait(wait)}`
          : 'Resend verification email';

    return (
        <>
            <Head title="Verify email" />
            <AuthShell
                eyebrow="Almost there"
                heading={<>Check your <em style={{ color: 'var(--accent)' }}>inbox</em>.</>}
                sub="We sent a verification link to your email address. Click it to activate your account and start learning."
                quote="Good things come to those who verify their email."
                word={{ word: 'verify', pron: '/ˈver.ɪ.faɪ/', pos: 'verb', defn: 'To prove that something is true or correct, or to make certain it is right.', level: 'B2' }}
            >
                {status === 'verification-link-sent' && (
                    <Alert tone="success" className="mb-5">
                        A new verification link has been sent to your email address.
                    </Alert>
                )}

                {status === 'verification-link-failed' && (
                    <Alert tone="danger" className="mb-5">
                        We couldn't send the email right now. This attempt didn't count —
                        please try again in a moment.
                    </Alert>
                )}

                {status === 'verification-link-throttled' && (
                    <Alert tone="warning" className="mb-5">
                        Please wait a moment before requesting another email.
                    </Alert>
                )}

                {blocked && (
                    <Alert tone="danger" className="mb-5">
                        You've used all {state.max_attempts} attempts. You can request another
                        email in {formatWait(wait)}. If it still doesn't arrive, check your spam
                        folder or contact us and we'll verify your account manually.
                    </Alert>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', alignItems: 'center', textAlign: 'center' }}>
                    <p style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-muted)', lineHeight: 1.6, maxWidth: '34ch' }}>
                        Didn't get the email? Check your spam folder, or click below to resend it.
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
                            {state.attempts_left} of {state.max_attempts} attempts left
                            {waiting && ' · one email per minute'}
                        </p>
                    )}

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-subtle)', marginTop: 'var(--s-3)' }}
                    >
                        Log out and use a different account
                    </Link>
                </div>
            </AuthShell>
        </>
    );
}
