import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { baseName, formatFromFileInfo, sniffFormat } from './formats'

const fixture = (name: string) => new Uint8Array(readFileSync(join(import.meta.dirname, '../../e2e/fixtures', name)).subarray(0, 4096))

describe('sniffFormat on real files', () => {
  const cases: [string, string][] = [
    ['pattern.jpg', 'jpeg'],
    ['exif-rotated.jpg', 'jpeg'],
    ['pattern.png', 'png'],
    ['alpha.png', 'png'],
    ['pattern.gif', 'gif'],
    ['pattern.webp', 'webp'],
    ['pattern.bmp', 'bmp'],
    ['pattern.tiff', 'tiff'],
    ['pattern.heic', 'heic'],
    ['pattern.avif', 'avif'],
    ['pattern.ico', 'ico'],
    ['pattern.svg', 'svg'],
    ['viewbox-only.svg', 'svg'],
  ]
  it.each(cases)('%s → %s', (file, expected) => {
    expect(sniffFormat(fixture(file))).toBe(expected)
  })

  it('does not recognise a text file', () => {
    expect(sniffFormat(fixture('not-an-image.txt'))).toBeNull()
  })

  it('recognises an SVG with an XML prolog, BOM and comments', () => {
    const svg = '﻿<?xml version="1.0"?>\n<!-- made by hand -->\n<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    expect(sniffFormat(new TextEncoder().encode(svg))).toBe('svg')
  })

  it('does not mistake HTML for SVG', () => {
    expect(sniffFormat(new TextEncoder().encode('<html><body>svg</body></html>'))).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(sniffFormat(new Uint8Array())).toBeNull()
  })
})

describe('formatFromFileInfo', () => {
  it('uses the MIME type first, then the extension', () => {
    expect(formatFromFileInfo('a.bin', 'image/heic')).toBe('heic')
    expect(formatFromFileInfo('IMG_0001.HEIC', '')).toBe('heic')
    expect(formatFromFileInfo('scan.TIF', '')).toBe('tiff')
    expect(formatFromFileInfo('notes.txt', 'text/plain')).toBeNull()
  })
})

describe('baseName', () => {
  it('strips the extension and unsafe characters', () => {
    expect(baseName('Holiday photo.final.JPG')).toBe('Holiday photo.final')
    expect(baseName('a/b:c.png')).toBe('a_b_c')
    expect(baseName('.png')).toBe('.png')
    expect(baseName('')).toBe('image')
  })
})
