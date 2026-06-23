import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, LoaderCircle, KeyRound } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/input';

interface Props {
    name: string;
    email: string;
}

interface InviteForm {
    invitation_code: string;
}

export default function GoogleInvite({ name, email }: Props) {
    const { data, setData, post, processing, errors } = useForm<InviteForm>({
        invitation_code: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('auth.google.invite.submit'));
    };

    return (
        <>
            <Head title="Invitation Code Required" />

            <style dangerouslySetInnerHTML={{ __html: `
                html, body { height: 100%; margin: 0; }

                .invite-page {
                    min-height: 100dvh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg);
                    padding: var(--s-5);
                }

                .invite-card {
                    width: 100%;
                    max-width: 440px;
                    background: var(--bg-elevated);
                    border: 1px solid var(--line);
                    border-radius: var(--r-xl);
                    box-shadow: var(--shadow-lg);
                    padding: var(--s-8) var(--s-8);
                }

                .invite-icon {
                    width: 52px; height: 52px;
                    border-radius: var(--r-lg);
                    background: var(--accent-soft, oklch(from var(--accent) l c h / 0.12));
                    display: grid; place-items: center;
                    color: var(--accent);
                    margin-bottom: var(--s-6);
                }

                .invite-card h1 {
                    font-size: var(--fs-22);
                    font-weight: 700;
                    letter-spacing: -0.01em;
                    color: var(--ink);
                    margin: 0 0 var(--s-2);
                }

                .invite-card .sub {
                    font-size: var(--fs-14);
                    color: var(--ink-muted);
                    line-height: 1.55;
                    margin: 0 0 var(--s-6);
                }

                .google-user {
                    display: flex;
                    align-items: center;
                    gap: var(--s-3);
                    padding: var(--s-3) var(--s-4);
                    background: var(--bg-sunken);
                    border: 1px solid var(--line-subtle);
                    border-radius: var(--r-md);
                    margin-bottom: var(--s-6);
                }

                .google-avatar {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    background: var(--accent);
                    display: grid; place-items: center;
                    font-size: var(--fs-14);
                    font-weight: 700;
                    color: white;
                    flex-shrink: 0;
                    text-transform: uppercase;
                }

                .google-user-info {
                    min-width: 0;
                }

                .google-user-name {
                    font-size: var(--fs-14);
                    font-weight: 600;
                    color: var(--ink);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .google-user-email {
                    font-size: var(--fs-12);
                    color: var(--ink-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .invite-form {
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-5);
                }
            `}} />

            <div className="invite-page">
                <div className="invite-card">
                    <div className="invite-icon">
                        <KeyRound size={24} />
                    </div>

                    <h1>One last step</h1>
                    <p className="sub">
                        Almost there! Enter your invitation code to complete your sign-up with Google.
                    </p>

                    <div className="google-user">
                        <div className="google-avatar">{name.charAt(0)}</div>
                        <div className="google-user-info">
                            <div className="google-user-name">{name}</div>
                            <div className="google-user-email">{email}</div>
                        </div>
                    </div>

                    <form className="invite-form" onSubmit={submit}>
                        <Field label="Invitation Code" htmlFor="invitation_code" error={errors.invitation_code}>
                            <Input
                                id="invitation_code"
                                type="text"
                                required
                                autoFocus
                                autoComplete="off"
                                placeholder="e.g. KPUCOFFE20"
                                value={data.invitation_code}
                                onChange={(e) => setData('invitation_code', e.target.value.toUpperCase())}
                                invalid={!!errors.invitation_code}
                                disabled={processing}
                            />
                        </Field>

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
                            Complete sign-up
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}
