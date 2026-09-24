// localStorage can throw (private mode, blocked site data): never let it break the app.
export function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(`trimly:${key}`)
  } catch {
    return null
  }
}

export function writePref(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(`trimly:${key}`)
    else window.localStorage.setItem(`trimly:${key}`, value)
  } catch {
    /* ignore */
  }
}
