import { describe, expect, it } from 'vitest'
import { formatBytes, needsTransparency, outputFileName, outputSize, recommendedFormat } from './export'

const photo = { hasAlpha: false, format: 'jpeg' as const }
const logo = { hasAlpha: true, format: 'png' as const }
const rect = { shape: 'rect' as const, background: null }
const circle = { shape: 'circle' as const, background: null }
const whiteCircle = { shape: 'circle' as const, background: '#ffffff' }

describe('transparency and format choice', () => {
  it('knows when the result has transparent pixels', () => {
    expect(needsTransparency(photo, rect)).toBe(false)
    expect(needsTransparency(photo, circle)).toBe(true)
    expect(needsTransparency(photo, whiteCircle)).toBe(false)
    expect(needsTransparency(logo, rect)).toBe(true)
    // A coloured background fills the logo's transparent parts too.
    expect(needsTransparency(logo, whiteCircle)).toBe(false)
  })

  it('recommends PNG for transparency, JPG for photos, PNG for graphics', () => {
    expect(recommendedFormat(photo, circle)).toBe('png')
    expect(recommendedFormat(photo, rect)).toBe('jpeg')
    expect(recommendedFormat(photo, whiteCircle)).toBe('jpeg')
    expect(recommendedFormat({ hasAlpha: false, format: 'png' }, rect)).toBe('png')
    expect(recommendedFormat({ hasAlpha: false, format: 'heic' }, rect)).toBe('jpeg')
    // No canvas here, so WebP encoding is "unsupported": falls back to JPG.
    expect(recommendedFormat({ hasAlpha: false, format: 'webp' }, rect)).toBe('jpeg')
  })
})

describe('outputSize', () => {
  it('uses the crop size by default', () => {
    expect(outputSize({ w: 1199.6, h: 800.2 }, { mode: 'original' })).toEqual({ w: 1200, h: 800, limited: false, upscaled: false })
  })

  it('keeps the ratio for a custom width', () => {
    expect(outputSize({ w: 1200, h: 800 }, { mode: 'custom', width: 600 })).toEqual({ w: 600, h: 400, limited: false, upscaled: false })
  })

  it('flags enlargements', () => {
    expect(outputSize({ w: 300, h: 300 }, { mode: 'custom', width: 1080 }).upscaled).toBe(true)
  })

  it('stays within canvas limits', () => {
    const s = outputSize({ w: 1000, h: 1000 }, { mode: 'custom', width: 50000 })
    expect(s.limited).toBe(true)
    expect(s.w).toBeLessThanOrEqual(16384)
    expect(s.w).toBe(s.h)
  })
})

describe('names and sizes', () => {
  it('builds the download name', () => {
    expect(outputFileName({ name: 'IMG_0042' }, 'jpeg')).toBe('IMG_0042-cropped.jpg')
    expect(outputFileName({ name: 'logo' }, 'png')).toBe('logo-cropped.png')
  })

  it('formats file sizes', () => {
    expect(formatBytes(512, 'en')).toBe('512 B')
    expect(formatBytes(245_300, 'en')).toBe('245 KB')
    expect(formatBytes(2_450_000, 'it')).toBe('2,5 MB')
  })
})
