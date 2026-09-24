import { en } from './en'

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, string>
export type Locale = 'it' | 'en'
export const LOCALES: Locale[] = ['it', 'en']

/** First supported language in the browser's preference list, English otherwise. */
export function detectLocale(languages: readonly string[]): Locale {
  for (const lang of languages) {
    const base = lang.toLowerCase().split('-')[0]
    if (base === 'it' || base === 'en') return base
  }
  return 'en'
}

export function parseLocale(value: string | null): Locale | null {
  return value === 'it' || value === 'en' ? value : null
}

/** Replaces `{name}` placeholders; unknown placeholders are left visible so they're easy to spot. */
export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
}
