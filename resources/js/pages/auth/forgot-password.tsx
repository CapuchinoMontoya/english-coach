import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/input-temp';
import { Alert } from '@/components/ui/Alert';
import { AuthShell } from './_auth-shell';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Forgot password" />
            <AuthShell
                eyebrow="Account recovery"
                heading={<>Reset your <em style={{ color: 'var(--accent)' }}>password</em>.</>}
                sub="Enter your email and we'll send you a secure link to choose a new password."
                quote="Every great journey begins with a single step — and sometimes a forgotten password."
                word={{ word: 'recover', pron: '/rɪˈkʌv.ər/', pos: 'verb', defn: 'To return to a normal state of health, mind, or strength.', level: 'B1' }}
            >
                {status && (
                    <Alert tone="success" className="mb-4">
                        {status}
                    </Alert>
                )}

                <form className="login" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
                    <Field label="Email address" htmlFor="email" error={errors.email}>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            invalid={!!errors.email}
                        />
                    </Field>

                    <div className="submit-row" style={{ marginTop: 'var(--s-2)' }}>
                        <Button
                            type="submit"
                            size="lg"
                            disabled={processing}
                            className="w-full"
                            trailingIcon={
                                processing
                                    ? <LoaderCircle className="h-4 w-4 animate-spin" />
                                    : <ArrowRight size={16} />
                            }
                        >
                            Send reset link
                        </Button>
                    </div>
                </form>

                <p style={{ textAlign: 'center', fontSize: 'var(--fs-14)', color: 'var(--ink-muted)', marginTop: 'var(--s-7)' }}>
                    Remembered it?{' '}
                    <Link href={route('login')} style={{ color: 'var(--ink)', fontWeight: 500, borderBottom: '1px solid var(--line-strong)', paddingBottom: 1 }}>
                        Log in →
                    </Link>
                </p>
            </AuthShell>
        </>
    );
}
