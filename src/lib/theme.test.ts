import { describe, expect, it } from 'vitest'
import { effectiveTheme, parseThemePref, toggledThemePref } from './theme'

describe('theme preference', () => {
  it('parses stored values defensively', () => {
    expect(parseThemePref('dark')).toBe('dark')
    expect(parseThemePref('light')).toBe('light')
    expect(parseThemePref(null)).toBe('system')
    expect(parseThemePref('purple')).toBe('system')
  })

  it('follows the system when set to system', () => {
    expect(effectiveTheme('system', 'dark')).toBe('dark')
    expect(effectiveTheme('light', 'dark')).toBe('light')
  })

  it('toggles the visible theme and returns to system when they match', () => {
    // OS is light, app follows it → toggle forces dark
    expect(toggledThemePref('system', 'light')).toBe('dark')
    // forced dark on a light OS → toggle goes back to following the OS
    expect(toggledThemePref('dark', 'light')).toBe('system')
    // forced light on a dark OS → toggle returns to system (dark)
    expect(toggledThemePref('light', 'dark')).toBe('system')
  })
})
