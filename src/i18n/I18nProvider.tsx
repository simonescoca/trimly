import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readPref, writePref } from '../lib/storage'
import { I18nContext, type I18n } from './context'
import { en } from './en'
import { detectLocale, format, parseLocale, type Locale, type Messages } from './index'
import { it } from './it'

const DICTS: Record<Locale, Messages> = { en, it }

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
