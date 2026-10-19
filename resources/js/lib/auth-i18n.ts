import { useCallback, useEffect, useState } from 'react'

// ─── Idiomas soportados en las pantallas de acceso ───────────────────────────
// El onboarding y el placement ya están en español; el login arrancaba solo en
// inglés. Aquí el usuario elige, y la preferencia se recuerda.

export type Locale = 'en' | 'es'

const STORAGE_KEY = 'capuchino.locale'

export const LOCALES: { code: Locale; short: string; name: string; intl: string }[] = [
    { code: 'en', short: 'EN', name: 'English', intl: 'en-US' },
    { code: 'es', short: 'ES', name: 'Español', intl: 'es-MX' },
]

export function intlTag(locale: Locale): string {
    return LOCALES.find(l => l.code === locale)?.intl ?? 'en-US'
}

/**
 * Lee/guarda el idioma elegido. Se sincroniza entre componentes de la misma
 * página mediante un evento propio, y persiste en localStorage.
 */
export function useLocale(): [Locale, (l: Locale) => void] {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window === 'undefined') return 'en'
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved === 'en' || saved === 'es') return saved
            // Sin preferencia guardada: respeta el idioma del navegador
            return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
        } catch {
            return 'en'
        }
    })

    // Mantiene <html lang> correcto (accesibilidad y lectores de pantalla)
    useEffect(() => {
        if (typeof document !== 'undefined') document.documentElement.lang = locale
    }, [locale])

    useEffect(() => {
        function onChange(e: Event) {
            const next = (e as CustomEvent<Locale>).detail
            if (next === 'en' || next === 'es') setLocaleState(next)
        }
        window.addEventListener('capuchino:locale', onChange)
        return () => window.removeEventListener('capuchino:locale', onChange)
    }, [])

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next)
        try { localStorage.setItem(STORAGE_KEY, next) } catch { /* noop */ }
        window.dispatchEvent(new CustomEvent('capuchino:locale', { detail: next }))
    }, [])

    return [locale, setLocale]
}

// ─── Textos ───────────────────────────────────────────────────────────────────

export interface AuthStrings {
    headTitle: string
    stampSmall: string
    stampBig: string
    stampEst: string
    quote: string
    quoteAttrib: string
    wordOfDay: string
    todaysWord: string
    privacy: string
    terms: string
    help: string
    systemsWarm: string
    newHere: string
    createAccount: string
    welcomeBack: string
    titlePre: string
    titleEm: string
    titlePost: string
    sub: string
    continueGoogle: string
    continueApple: string
    orEmail: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    forgot: string
    showPassword: string
    hidePassword: string
    remember: string
    logIn: string
    newToCapuchino: string
    brewFirst: string
    languageLabel: string
    verify: VerifyStrings
}

/** Pantalla de "confirma tu correo": es la primera que ve un recien registrado. */
export interface VerifyStrings {
    headTitle: string
    eyebrow: string
    titlePre: string
    titleEm: string
    titlePost: string
    sub: string
    quote: string
    wordDefn: string
    sentAlert: string
    failedAlert: string
    throttledAlert: string
    blockedAlert: (max: number, wait: string) => string
    didntGet: string
    resend: string
    resendIn: (wait: string) => string
    tooMany: string
    attemptsLeft: (left: number, max: number) => string
    onePerMinute: string
    logoutOther: string
}

export const AUTH_STRINGS: Record<Locale, AuthStrings> = {
    en: {
        headTitle:       'Log in',
        stampSmall:      'Daily',
        stampBig:        'ritual',
        stampEst:        'Est.',
        quote:           'A new word, served warm every morning.',
        quoteAttrib:     'The Capuchino promise',
        wordOfDay:       'Word of the day',
        todaysWord:      "Today's word",
        privacy:         'Privacy',
        terms:           'Terms',
        help:            'Help',
        systemsWarm:     'All systems warm',
        newHere:         'New here?',
        createAccount:   'Create account',
        welcomeBack:     'Welcome back',
        titlePre:        'Log in to your ',
        titleEm:         'cup',
        titlePost:       '.',
        sub:             'Pick up where you left off — your streak, your words, your lessons. We saved them all.',
        continueGoogle:  'Continue with Google',
        continueApple:   'Continue with Apple',
        orEmail:         'or sign in with email',
        emailLabel:      'Email address',
        emailPlaceholder:'you@example.com',
        passwordLabel:   'Password',
        forgot:          'Forgot it?',
        showPassword:    'Show password',
        hidePassword:    'Hide password',
        remember:        'Keep me signed in on this device',
        logIn:           'Log in',
        newToCapuchino:  'New to Capuchino?',
        brewFirst:       'Brew your first cup →',
        languageLabel:   'Language',
        verify: {
            headTitle:      'Verify email',
            eyebrow:        'Almost there',
            titlePre:       'Check your ',
            titleEm:        'inbox',
            titlePost:      '.',
            sub:            'We sent a verification link to your email address. Click it to activate your account and start learning.',
            quote:          'Good things come to those who verify their email.',
            wordDefn:       'To prove that something is true or correct, or to make certain it is right.',
            sentAlert:      'A new verification link has been sent to your email address.',
            failedAlert:    "We couldn't send the email right now. This attempt didn't count — please try again in a moment.",
            throttledAlert: 'Please wait a moment before requesting another email.',
            blockedAlert:   (max, wait) => `You've used all ${max} attempts. You can request another email in ${wait}. If it still doesn't arrive, check your spam folder or contact us and we'll verify your account manually.`,
            didntGet:       "Didn't get the email? Check your spam folder, or click below to resend it.",
            resend:         'Resend verification email',
            resendIn:       (wait) => `Resend in ${wait}`,
            tooMany:        'Too many attempts',
            attemptsLeft:   (left, max) => `${left} of ${max} attempts left`,
            onePerMinute:   'one email per minute',
            logoutOther:    'Log out and use a different account',
        },
    },
    es: {
        headTitle:       'Iniciar sesión',
        stampSmall:      'Ritual',
        stampBig:        'diario',
        stampEst:        'Desde',
        quote:           'Una palabra nueva, servida calientita cada mañana.',
        quoteAttrib:     'La promesa Capuchino',
        wordOfDay:       'Palabra del día',
        todaysWord:      'La palabra de hoy',
        privacy:         'Privacidad',
        terms:           'Términos',
        help:            'Ayuda',
        systemsWarm:     'Todo listo y calientito',
        newHere:         '¿Primera vez?',
        createAccount:   'Crear cuenta',
        welcomeBack:     'Qué bueno verte',
        titlePre:        'Entra a tu ',
        titleEm:         'taza',
        titlePost:       '.',
        sub:             'Sigue donde te quedaste: tu racha, tus palabras, tus lecciones. Todo está guardado.',
        continueGoogle:  'Continuar con Google',
        continueApple:   'Continuar con Apple',
        orEmail:         'o entra con tu correo',
        emailLabel:      'Correo electrónico',
        emailPlaceholder:'tu@correo.com',
        passwordLabel:   'Contraseña',
        forgot:          '¿La olvidaste?',
        showPassword:    'Mostrar contraseña',
        hidePassword:    'Ocultar contraseña',
        remember:        'Mantener mi sesión en este dispositivo',
        logIn:           'Iniciar sesión',
        newToCapuchino:  '¿Nuevo en Capuchino?',
        brewFirst:       'Prepara tu primera taza →',
        languageLabel:   'Idioma',
        verify: {
            headTitle:      'Confirma tu correo',
            eyebrow:        'Ya casi',
            titlePre:       'Revisa tu ',
            titleEm:        'bandeja',
            titlePost:      '.',
            sub:            'Te mandamos un enlace de confirmación a tu correo. Ábrelo para activar tu cuenta y empezar a aprender.',
            quote:          'Lo bueno llega a quien confirma su correo.',
            wordDefn:       'Comprobar que algo es cierto o correcto, o asegurarse de que está bien.',
            sentAlert:      'Te enviamos un enlace nuevo a tu correo.',
            failedAlert:    'No pudimos enviar el correo en este momento. Este intento no se contó; vuelve a probar en un rato.',
            throttledAlert: 'Espera un momento antes de pedir otro correo.',
            blockedAlert:   (max, wait) => `Usaste tus ${max} intentos. Podrás pedir otro correo en ${wait}. Si sigue sin llegar, revisa tu carpeta de spam o escríbenos y verificamos tu cuenta a mano.`,
            didntGet:       '¿No te llegó? Revisa tu carpeta de spam, o pulsa aquí abajo para reenviarlo.',
            resend:         'Reenviar el correo',
            resendIn:       (wait) => `Reenviar en ${wait}`,
            tooMany:        'Demasiados intentos',
            attemptsLeft:   (left, max) => `Te quedan ${left} de ${max} intentos`,
            onePerMinute:   'un correo por minuto',
            logoutOther:    'Cerrar sesión y usar otra cuenta',
        },
    },
}
