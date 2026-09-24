import { createContext, useContext } from 'react'
import type { Locale, MessageKey } from './index'

export type I18n = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
}

// Kept apart from the provider so editing the dictionaries during development
// doesn't recreate the context (which would disconnect every consumer).
export const I18nContext = createContext<I18n | null>(null)

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
