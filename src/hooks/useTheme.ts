import { useCallback, useEffect, useState } from 'react'
import { readPref, writePref } from '../lib/storage'
import { effectiveTheme, parseThemePref, toggledThemePref, type Theme, type ThemePref } from '../lib/theme'

const query = '(prefers-color-scheme: dark)'
const systemTheme = (): Theme => (window.matchMedia?.(query).matches ? 'dark' : 'light')
const META_COLORS: Record<Theme, string> = { light: '#f6f6f8', dark: '#0d0d10' }

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => parseThemePref(readPref('theme')))
  const [system, setSystem] = useState<Theme>(systemTheme)

  useEffect(() => {
    const mq = window.matchMedia?.(query)
    if (!mq) return
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const theme = effectiveTheme(pref, system)

  useEffect(() => {
    const root = document.documentElement
    if (pref === 'system') delete root.dataset.theme
    else root.dataset.theme = pref
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = META_COLORS[pref === 'system' ? (meta.media.includes('dark') ? 'dark' : 'light') : pref]
    })
  }, [pref])

  const toggle = useCallback(() => {
    setPref((current) => {
      const next = toggledThemePref(current, systemTheme())
      writePref('theme', next === 'system' ? null : next)
      return next
    })
  }, [])

  return { theme, toggle }
}
