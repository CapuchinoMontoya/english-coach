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
    },
}
