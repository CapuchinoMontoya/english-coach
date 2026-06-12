import { useRef, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, useForm, router, usePage } from '@inertiajs/react'
import { Camera, User, Lock, Bell, Heart, Plus, Check } from 'lucide-react'
import './profile.css'

interface Settings {
    avatar_url:          string | null
    homework_enabled:    boolean
    email_notifications: boolean
    interests:           string[]
    level?:              string | null
}

interface PageProps {
    settings:        Settings
    mustVerifyEmail: boolean
    [key: string]:   any
}

type Tab = 'account' | 'security' | 'preferences' | 'interests'

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
    return <button type="button" className={`pf-switch ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on}><span /></button>
}

const TABS: { id: Tab; label: string; icon: any; title: string; sub: string }[] = [
    { id: 'account',     label: 'Account',     icon: User,  title: 'Account',      sub: 'Your name and email address' },
    { id: 'security',    label: 'Security',    icon: Lock,  title: 'Security',     sub: 'Change your password' },
    { id: 'preferences', label: 'Preferences', icon: Bell,  title: 'Preferences',  sub: 'How your learning works' },
    { id: 'interests',   label: 'Interests',   icon: Heart, title: 'Your interests', sub: 'We personalize everything around these' },
]

export default function Profile({ settings, mustVerifyEmail }: PageProps) {
    const { auth } = usePage<PageProps>().props as any
    const fileRef = useRef<HTMLInputElement>(null)
    const [tab, setTab] = useState<Tab>('account')
    const [newInterest, setNewInterest] = useState('')

    const form = useForm({
        name:                auth.user.name as string,
        email:               auth.user.email as string,
        homework_enabled:    settings.homework_enabled,
        email_notifications: settings.email_notifications,
        interests:           settings.interests ?? [],
    })

    const pw = useForm({ current_password: '', password: '', password_confirmation: '' })

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Profile',   href: '#' },
    ]

    const initials = (auth.user.name as string).trim().split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    const active = TABS.find(t => t.id === tab)!

    const saveProfile = () => form.patch('/settings/profile', { preserveScroll: true })

    function savePassword(e: React.FormEvent) {
        e.preventDefault()
        pw.put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => pw.reset(),
            onError:   () => pw.reset('password', 'password_confirmation'),
        })
    }

    function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) router.post('/settings/profile/avatar', { avatar: file }, { forceFormData: true, preserveScroll: true })
    }

    function addInterest() {
        const v = newInterest.trim()
        if (v && !form.data.interests.includes(v)) form.setData('interests', [...form.data.interests, v])
        setNewInterest('')
    }
    const removeInterest = (i: string) => form.setData('interests', form.data.interests.filter(x => x !== i))

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile" />

            <div className="pf-root">
                <div className="pf-shell">

                    {/* ─── Sidebar ─── */}
                    <aside className="pf-side">
                        <div className="pf-side-hero">
                            <div className="pf-avatar-wrap" onClick={() => fileRef.current?.click()}>
                                <div className="pf-avatar">
                                    {settings.avatar_url ? <img src={settings.avatar_url} alt="" /> : initials}
                                </div>
                                <div className="pf-avatar-overlay"><Camera size={20} /></div>
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarPick} style={{ display: 'none' }} />
                            <div className="pf-side-info">
                                <div className="pf-side-name">{auth.user.name}</div>
                                <div className="pf-side-email">{auth.user.email}</div>
                                {settings.level && <span className="pf-side-badge">{settings.level}</span>}
                            </div>
                        </div>

                        <nav className="pf-tabs">
                            {TABS.map(t => {
                                const Icon = t.icon
                                return (
                                    <button key={t.id} className={`pf-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                                        <span className="pf-tab-ic"><Icon size={17} /></span>
                                        <span className="pf-tab-label">{t.label}</span>
                                    </button>
                                )
                            })}
                        </nav>
                    </aside>

                    {/* ─── Main panel ─── */}
                    <section className="pf-main">
                        <div className="pf-main-head">
                            <div className="pf-main-title">{active.title}</div>
                            <div className="pf-main-sub">{active.sub}</div>
                        </div>

                        {/* ACCOUNT */}
                        {tab === 'account' && (
                            <>
                                <div className="pf-panel">
                                    <div className="pf-field">
                                        <label className="pf-label">Name</label>
                                        <input className="pf-input" value={form.data.name} onChange={e => form.setData('name', e.target.value)} />
                                        {form.errors.name && <div className="pf-error">{form.errors.name}</div>}
                                    </div>
                                    <div className="pf-field">
                                        <label className="pf-label">Email</label>
                                        <input className="pf-input" type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} />
                                        {form.errors.email && <div className="pf-error">{form.errors.email}</div>}
                                        {mustVerifyEmail && !auth.user.email_verified_at && <div className="pf-note">Your email is not verified.</div>}
                                    </div>
                                </div>
                                <ProfileFoot form={form} onSave={saveProfile} />
                            </>
                        )}

                        {/* SECURITY */}
                        {tab === 'security' && (
                            <form onSubmit={savePassword} style={{ display: 'contents' }}>
                                <div className="pf-panel">
                                    <div className="pf-field">
                                        <label className="pf-label">Current password</label>
                                        <input className="pf-input" type="password" autoComplete="current-password"
                                            value={pw.data.current_password} onChange={e => pw.setData('current_password', e.target.value)} />
                                        {pw.errors.current_password && <div className="pf-error">{pw.errors.current_password}</div>}
                                    </div>
                                    <div className="pf-field">
                                        <label className="pf-label">New password</label>
                                        <input className="pf-input" type="password" autoComplete="new-password"
                                            value={pw.data.password} onChange={e => pw.setData('password', e.target.value)} />
                                        {pw.errors.password && <div className="pf-error">{pw.errors.password}</div>}
                                    </div>
                                    <div className="pf-field">
                                        <label className="pf-label">Confirm new password</label>
                                        <input className="pf-input" type="password" autoComplete="new-password"
                                            value={pw.data.password_confirmation} onChange={e => pw.setData('password_confirmation', e.target.value)} />
                                    </div>
                                </div>
                                <div className="pf-foot">
                                    {pw.recentlySuccessful && <span className="pf-saved"><Check size={15} /> Updated</span>}
                                    <button type="submit" className="pf-btn pf-btn-primary" disabled={pw.processing}>Update password</button>
                                </div>
                            </form>
                        )}

                        {/* PREFERENCES */}
                        {tab === 'preferences' && (
                            <>
                                <div className="pf-panel">
                                    <div className="pf-toggle-row">
                                        <div>
                                            <div className="pf-toggle-label">Homework between sessions</div>
                                            <div className="pf-toggle-desc">Get short assignments to reinforce what you learn.</div>
                                        </div>
                                        <Switch on={form.data.homework_enabled} onClick={() => form.setData('homework_enabled', !form.data.homework_enabled)} />
                                    </div>
                                    <div className="pf-toggle-row">
                                        <div>
                                            <div className="pf-toggle-label">Email notifications</div>
                                            <div className="pf-toggle-desc">Reminders and progress updates to your inbox.</div>
                                        </div>
                                        <Switch on={form.data.email_notifications} onClick={() => form.setData('email_notifications', !form.data.email_notifications)} />
                                    </div>
                                </div>
                                <ProfileFoot form={form} onSave={saveProfile} />
                            </>
                        )}

                        {/* INTERESTS */}
                        {tab === 'interests' && (
                            <>
                                <div className="pf-panel">
                                    <div className="pf-chips">
                                        {form.data.interests.length === 0 && <span className="pf-chips-empty">No interests yet — add some below.</span>}
                                        {form.data.interests.map(i => (
                                            <span key={i} className="pf-chip">
                                                {i}
                                                <button type="button" className="pf-chip-x" onClick={() => removeInterest(i)} aria-label={`Remove ${i}`}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="pf-add-row">
                                        <input className="pf-input" value={newInterest}
                                            onChange={e => setNewInterest(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest() } }}
                                            placeholder="e.g. The Witcher, Eminem, Sci-Fi..." />
                                        <button type="button" className="pf-btn pf-btn-soft" onClick={addInterest} style={{ whiteSpace: 'nowrap' }}>
                                            <Plus size={15} /> Add
                                        </button>
                                    </div>
                                </div>
                                <ProfileFoot form={form} onSave={saveProfile} />
                            </>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    )
}

function ProfileFoot({ form, onSave }: { form: any; onSave: () => void }) {
    return (
        <div className="pf-foot">
            {form.recentlySuccessful && !form.isDirty && <span className="pf-saved"><Check size={15} /> Saved</span>}
            {form.isDirty && <button className="pf-btn pf-btn-ghost" type="button" onClick={() => form.reset()}>Discard</button>}
            <button className="pf-btn pf-btn-primary" type="button" onClick={onSave} disabled={form.processing || !form.isDirty}>
                Save changes
            </button>
        </div>
    )
}