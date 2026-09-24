import { expect, it } from 'vitest'
import { parseNumber } from './number'

it('parses numbers typed with a comma or a dot', () => {
  expect(parseNumber('3,5')).toBe(3.5)
  expect(parseNumber(' 1080 ')).toBe(1080)
  expect(parseNumber('4.25')).toBe(4.25)
  expect(parseNumber('')).toBeNaN()
  expect(parseNumber('abc')).toBeNaN()
})
