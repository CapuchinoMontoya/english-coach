// ─── Idioma de la interfaz de la lección, según el nivel del alumno ──────────
// A1/A2 → español: los botones y etiquetas son navegación, no material de
// estudio. Hacer que un principiante descifre "Continue to writing" le suma
// fricción sin enseñarle nada. El contenido de la lección sigue sus propias
// reglas (A1 en español, A2+ en inglés con traductor).
// B1+ → inglés.

export type LessonLocale = 'en' | 'es'

export function lessonLocale(level?: string | null): LessonLocale {
    return ['A0', 'A1', 'A2'].includes(String(level ?? 'B1').toUpperCase()) ? 'es' : 'en'
}

export interface LessonStrings {
    // Barra de fases
    phaseWarmup: string
    phaseLesson: string
    phasePractice: string
    phaseWriting: string
    phaseResults: string
    // Encabezado
    topicSession: (topic: number, session: number) => string
    todaysFocus: string
    progressSoFar: string
    consolidation: string
    // Carga y errores
    preparing: string
    stagesGenerate: string[]
    stagesEvaluate: string[]
    checking: string
    genFailed: string
    connError: string
    evalFailed: string
    evalConnError: string
    tryAgain: string
    // Warm-up
    warmupBanner: string
    continueToLesson: string
    // Mini-lección
    readyToPractice: string
    // Práctica
    practiceHint: string
    exerciseNum: (i: number, total: number) => string
    arrangeWords: string
    typeAnswer: string
    writeTranslation: string
    writeCorrected: string
    clickWords: string
    clearWords: string
    continueToWriting: string
    // Producción libre
    writingTask: string
    writePlaceholder: string
    wordsMinimum: string
    back: string
    submitSession: string
    // Resultados
    verdictMastered: string
    verdictAlmost: string
    verdictProgress: string
    msgMastered: string
    msgAlmost: string
    keepBuilding: string
    chipThisSession: string
    chipTopicAverage: string
    chipSessionsDone: string
    writingFeedback: string
    youAnswered: string
    correctAnswer: string
    backToLessons: string
    startNextSession: string
    continueNextTopic: string
}

export const LESSON_STRINGS: Record<LessonLocale, LessonStrings> = {
    en: {
        phaseWarmup:      'Warm-up',
        phaseLesson:      'Lesson',
        phasePractice:    'Practice',
        phaseWriting:     'Writing',
        phaseResults:     'Results',
        topicSession:     (t, s) => `Topic ${t} · Session ${s}`,
        todaysFocus:      "Today's focus:",
        progressSoFar:    'Progress so far:',
        consolidation:    '🎯 Consolidation session',
        preparing:        'Alex is preparing your session...',
        stagesGenerate:   ['Choosing today\'s focus', 'Writing your lesson',
                           'Building the exercises', 'Checking them over'],
        stagesEvaluate:   ['Reading your answers', 'Checking your writing',
                           'Writing your feedback'],
        checking:         'Alex is checking your work...',
        genFailed:        'Alex could not build the session right now. Please try again.',
        connError:        'Connection error. Please try again.',
        evalFailed:       'Alex could not check your work right now. Your answers are kept — please submit again.',
        evalConnError:    'Connection error while checking your work. Your answers are kept — please submit again.',
        tryAgain:         'Try again',
        warmupBanner:     '🔁 Quick review of what you learned last time',
        continueToLesson: 'Continue to lesson →',
        readyToPractice:  "I'm ready to practice →",
        practiceHint:     "Answer on your own — no hints. That's how you learn.",
        exerciseNum:      (i, total) => `Exercise ${i} / ${total}`,
        arrangeWords:     'Arrange these words:',
        typeAnswer:       'Type your answer...',
        writeTranslation: 'Write your translation in English...',
        writeCorrected:   'Write the corrected sentence...',
        clickWords:       'Click words below to build your sentence...',
        clearWords:       '✕ clear',
        continueToWriting:'Continue to writing →',
        writingTask:      'Your writing task',
        writePlaceholder: 'Write your answer here in English...',
        wordsMinimum:     'words minimum',
        back:             '← Back',
        submitSession:    'Submit session',
        verdictMastered:  'Topic mastered!',
        verdictAlmost:    'Almost there!',
        verdictProgress:  'Great progress!',
        msgMastered:      "You've shown consistent mastery across multiple sessions. The next topic is now unlocked.",
        msgAlmost:        "You've covered all the material — one more solid session will lock it in.",
        keepBuilding:     'Come back for your next session to keep building.',
        chipThisSession:  'This session',
        chipTopicAverage: 'Topic average',
        chipSessionsDone: 'Sessions done',
        writingFeedback:  'Feedback on your writing',
        youAnswered:      'You:',
        correctAnswer:    'Correct:',
        backToLessons:    'Back to lessons',
        startNextSession: 'Start next session →',
        continueNextTopic:'Continue to next topic →',
    },
    es: {
        phaseWarmup:      'Repaso',
        phaseLesson:      'Lección',
        phasePractice:    'Práctica',
        phaseWriting:     'Escritura',
        phaseResults:     'Resultados',
        topicSession:     (t, s) => `Tema ${t} · Sesión ${s}`,
        todaysFocus:      'Hoy practicas:',
        progressSoFar:    'Tu avance:',
        consolidation:    '🎯 Sesión de consolidación',
        preparing:        'Alex está preparando tu sesión...',
        stagesGenerate:   ['Eligiendo el tema de hoy', 'Escribiendo tu lección',
                           'Armando los ejercicios', 'Revisándolos'],
        stagesEvaluate:   ['Leyendo tus respuestas', 'Revisando tu escritura',
                           'Escribiendo tus comentarios'],
        checking:         'Alex está revisando tu trabajo...',
        genFailed:        'Alex no pudo armar la sesión en este momento. Inténtalo de nuevo.',
        connError:        'Error de conexión. Inténtalo de nuevo.',
        evalFailed:       'Alex no pudo revisar tu trabajo ahora. Tus respuestas se guardaron; envíalo otra vez.',
        evalConnError:    'Error de conexión al revisar tu trabajo. Tus respuestas se guardaron; envíalo otra vez.',
        tryAgain:         'Reintentar',
        warmupBanner:     '🔁 Repaso rápido de lo que viste la vez pasada',
        continueToLesson: 'Ir a la lección →',
        readyToPractice:  'Listo para practicar →',
        practiceHint:     'Contesta por tu cuenta, sin ayudas. Así es como se aprende.',
        exerciseNum:      (i, total) => `Ejercicio ${i} de ${total}`,
        arrangeWords:     'Ordena estas palabras:',
        typeAnswer:       'Escribe tu respuesta...',
        writeTranslation: 'Escribe tu traducción en inglés...',
        writeCorrected:   'Escribe la oración corregida...',
        clickWords:       'Toca las palabras de abajo para armar la oración...',
        clearWords:       '✕ borrar',
        continueToWriting:'Ir a la escritura →',
        writingTask:      'Tu tarea de escritura',
        writePlaceholder: 'Escribe aquí tu respuesta en inglés...',
        wordsMinimum:     'palabras mínimo',
        back:             '← Atrás',
        submitSession:    'Enviar sesión',
        verdictMastered:  '¡Tema dominado!',
        verdictAlmost:    '¡Ya casi!',
        verdictProgress:  '¡Buen avance!',
        msgMastered:      'Demostraste dominio constante en varias sesiones. El siguiente tema ya está desbloqueado.',
        msgAlmost:        'Ya cubriste todo el material. Una sesión sólida más y queda asentado.',
        keepBuilding:     'Vuelve en tu próxima sesión para seguir construyendo.',
        chipThisSession:  'Esta sesión',
        chipTopicAverage: 'Promedio del tema',
        chipSessionsDone: 'Sesiones hechas',
        writingFeedback:  'Comentarios sobre tu escritura',
        youAnswered:      'Tú:',
        correctAnswer:    'Correcto:',
        backToLessons:    'Volver a lecciones',
        startNextSession: 'Empezar siguiente sesión →',
        continueNextTopic:'Continuar al siguiente tema →',
    },
}
