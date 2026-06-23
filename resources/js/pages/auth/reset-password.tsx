import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/input';
import { AuthShell } from './_auth-shell';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Reset password" />
            <AuthShell
                eyebrow="New password"
                heading={<>Choose a new <em style={{ color: 'var(--accent)' }}>password</em>.</>}
                sub="Make it strong — at least 8 characters with a mix of letters and numbers."
                quote="A fresh start is just a password away."
                word={{ word: 'renew', pron: '/rɪˈnjuː/', pos: 'verb', defn: 'To make something new again or to replace it with something new.', level: 'A2' }}
            >
                <form className="login" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
                    {/* Hidden email field */}
                    <input type="hidden" name="token" value={data.token} />
                    <input type="hidden" name="email" value={data.email} />

                    <Field label="New password" htmlFor="password" error={errors.password}>
                        <div className="password-wrap">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoFocus
                                autoComplete="new-password"
                                placeholder="Create a strong password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                invalid={!!errors.password}
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

                    <Field label="Confirm password" htmlFor="password_confirmation" error={errors.password_confirmation}>
                        <div className="password-wrap">
                            <Input
                                id="password_confirmation"
                                type={showConfirm ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                placeholder="Confirm your password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                invalid={!!errors.password_confirmation}
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                className="reveal"
                                onClick={() => setShowConfirm((v) => !v)}
                                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                            >
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </Field>

                    <div style={{ marginTop: 'var(--s-2)' }}>
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
                            Reset password
                        </Button>
                    </div>
                </form>
            </AuthShell>
        </>
    );
}
