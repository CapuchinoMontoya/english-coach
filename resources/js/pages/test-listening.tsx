import ListeningGame from '@/components/ListeningGame'
import { Head } from '@inertiajs/react'
import song from './sample-amazing-grace.json'

// Página de prueba temporal para ver el ListeningGame funcionando.
// Ruta sugerida: /test-listening (solo para desarrollo)

export default function TestListening() {
    return (
        <>
            <Head title="Listening Test" />
            <div style={{ minHeight: '100vh', background: '#FAF6F1', paddingTop: 20 }}>
                <ListeningGame
                    song={song as any}
                    rewindSecs={4}
                    graceSecs={0.5}
                    onComplete={(result) => {
                        console.log('Resultado:', result)
                        alert(`¡Terminaste! ${result.correct}/${result.total} correctas (${result.score}%)`)
                    }}
                />
            </div>
        </>
    )
}