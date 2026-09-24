import { describe, expect, it } from 'vitest'
import { parseSvgLength, svgIntrinsicSize } from './decode'

describe('parseSvgLength', () => {
  it('reads absolute units', () => {
    expect(parseSvgLength('400')).toBe(400)
    expect(parseSvgLength(' 400px ')).toBe(400)
    expect(parseSvgLength('1in')).toBe(96)
    expect(parseSvgLength('72pt')).toBe(96)
    expect(parseSvgLength('2.54cm')).toBeCloseTo(96)
    expect(parseSvgLength('1e2')).toBe(100)
  })

  it('rejects relative units, zero and garbage', () => {
    expect(parseSvgLength('100%')).toBeNull()
    expect(parseSvgLength('2em')).toBeNull()
    expect(parseSvgLength('0')).toBeNull()
    expect(parseSvgLength('auto')).toBeNull()
    expect(parseSvgLength(null)).toBeNull()
  })
})

describe('svgIntrinsicSize', () => {
  it('prefers explicit width and height', () => {
    expect(svgIntrinsicSize('400', '300', '0 0 40 30')).toEqual({ w: 400, h: 300 })
  })

  it('completes a missing dimension from the viewBox ratio', () => {
    expect(svgIntrinsicSize('800', null, '0 0 400 300')).toEqual({ w: 800, h: 600 })
    expect(svgIntrinsicSize('100%', '150', '0 0 400 300')).toEqual({ w: 200, h: 150 })
  })

  it('falls back to the viewBox, then to a square', () => {
    expect(svgIntrinsicSize(null, null, '0,0,400,300')).toEqual({ w: 400, h: 300 })
    expect(svgIntrinsicSize(null, null, null)).toEqual({ w: 1024, h: 1024 })
    expect(svgIntrinsicSize('100%', '100%', 'garbage')).toEqual({ w: 1024, h: 1024 })
  })
})
