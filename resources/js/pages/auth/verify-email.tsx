import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/Alert';
import { AuthShell } from './_auth-shell';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

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

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', alignItems: 'center', textAlign: 'center' }}>
                    <p style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-muted)', lineHeight: 1.6, maxWidth: '34ch' }}>
                        Didn't get the email? Check your spam folder, or click below to resend it.
                    </p>

                    <form onSubmit={submit}>
                        <Button
                            type="submit"
                            variant="secondary"
                            size="lg"
                            disabled={processing}
                            leadingIcon={processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail size={16} />}
                        >
                            Resend verification email
                        </Button>
                    </form>

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
