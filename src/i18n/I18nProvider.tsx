import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readPref, writePref } from '../lib/storage'
import { en } from './en'
import { detectLocale, format, parseLocale, type Locale, type MessageKey, type Messages } from './index'
import { it } from './it'

const DICTS: Record<Locale, Messages> = { en, it }

type I18n = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => parseLocale(readPref('locale')) ?? detectLocale(navigator.languages ?? [navigator.language]),
  )

  const setLocale = useCallback((next: Locale) => {
    writePref('locale', next)
    setLocaleState(next)
  }, [])

  const t = useCallback<I18n['t']>((key, vars) => format(DICTS[locale][key], vars), [locale])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = DICTS[locale]['app.title']
    document.querySelector('meta[name="description"]')?.setAttribute('content', DICTS[locale]['app.description'])
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
