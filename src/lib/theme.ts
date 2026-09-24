export type Theme = 'light' | 'dark'
export type ThemePref = Theme | 'system'

export function parseThemePref(value: string | null): ThemePref {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function effectiveTheme(pref: ThemePref, system: Theme): Theme {
  return pref === 'system' ? system : pref
}

/**
 * Toggling flips the visible theme. If the result matches the OS theme we go
 * back to following the OS, so the app keeps tracking it afterwards.
 */
export function toggledThemePref(pref: ThemePref, system: Theme): ThemePref {
  const next: Theme = effectiveTheme(pref, system) === 'light' ? 'dark' : 'light'
  return next === system ? 'system' : next
}
