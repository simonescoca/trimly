import { describe, expect, it as test } from 'vitest'
import { en } from './en'
import { detectLocale, format, parseLocale } from './index'
import { it } from './it'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('translations', () => {
  test('Italian and English have exactly the same keys', () => {
    expect(Object.keys(it).sort()).toEqual(Object.keys(en).sort())
  })

  test('no translation is empty', () => {
    for (const [key, value] of [...Object.entries(en), ...Object.entries(it)]) {
      expect(value.trim(), key).not.toBe('')
    }
  })

  test('placeholders match between languages', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(it[key]), key).toEqual(placeholders(en[key]))
    }
  })
})

describe('detectLocale', () => {
  test('picks Italian for Italian browsers', () => {
    expect(detectLocale(['it-IT', 'en-US'])).toBe('it')
    expect(detectLocale(['IT'])).toBe('it')
  })

  test('picks the first supported language in order of preference', () => {
    expect(detectLocale(['fr-FR', 'en-GB', 'it'])).toBe('en')
    expect(detectLocale(['de', 'it-CH'])).toBe('it')
  })

  test('falls back to English', () => {
    expect(detectLocale(['fr', 'de'])).toBe('en')
    expect(detectLocale([])).toBe('en')
  })
})

describe('format', () => {
  test('replaces placeholders', () => {
    expect(format('Saved as {name}', { name: 'a.png' })).toBe('Saved as a.png')
    expect(format('{w}×{h}', { w: 3, h: 4 })).toBe('3×4')
  })

  test('leaves unknown placeholders visible', () => {
    expect(format('Hi {who}', {})).toBe('Hi {who}')
  })

  test('parseLocale rejects unknown values', () => {
    expect(parseLocale('it')).toBe('it')
    expect(parseLocale('fr')).toBeNull()
    expect(parseLocale(null)).toBeNull()
  })
})
