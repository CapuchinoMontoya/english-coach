import { useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import ListeningGame from '@/components/ListeningGame'

interface PlayProps {
    activityId: number
    song: {
        title:            string
        artist:           string
        youtube_video_id: string
        lines:            any[]
    }
    level:  string
    source: 'lesson' | 'free'
}

const csrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''

export default function Play({ activityId, song, level, source }: PlayProps) {
    const [done, setDone] = useState(false)

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard',  href: '/dashboard' },
        { title: 'Listening',  href: '/listening' },
        { title: song.title,   href: '#'          },
    ]

    async function handleComplete(result: { correct: number; total: number; score: number }) {
        setDone(true)
        try {
            await fetch('/listening/complete', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
                body:    JSON.stringify({
                    activity_id: activityId,
                    correct:     result.correct,
                    total:       result.total,
                    score:       result.score,
                    source:      source,   // 'lesson' o 'free'
                }),
            })
        } catch {
            // silencioso
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Listening: ${song.title}`} />

            <ListeningGame
                song={song as any}
                rewindSecs={4}
                graceSecs={0.5}
                onComplete={handleComplete}
            />

            {done && (
                <div style={{ textAlign: 'center', marginTop: 8, paddingBottom: 40 }}>
                    <button
                        onClick={() => router.visit(source === 'lesson' ? '/lessons' : '/listening')}
                        style={{
                            padding: '11px 24px', borderRadius: 10, border: '1px solid var(--line)',
                            background: 'transparent', color: 'var(--primary)', fontWeight: 500,
                            fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer',
                        }}
                    >
                        ← {source === 'lesson' ? 'Back to lessons' : 'Back to library'}
                    </button>
                </div>
            )}
        </AppLayout>
    )
}