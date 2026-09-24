import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Side-panel layout: desktops, and phones held sideways (too short for a bottom panel). */
export const DESKTOP_QUERY = '(min-width: 900px), (orientation: landscape) and (max-height: 540px) and (min-width: 560px)'
export const useIsDesktop = () => useMediaQuery(DESKTOP_QUERY)
