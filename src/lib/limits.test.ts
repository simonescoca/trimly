import { describe, expect, it } from 'vitest'
import { fitCanvasLimits } from './limits'

describe('fitCanvasLimits', () => {
  it('leaves small sizes alone', () => {
    expect(fitCanvasLimits(4000, 3000, 16384, 64e6)).toEqual({ w: 4000, h: 3000, scale: 1 })
  })

  it('respects the area limit keeping the aspect ratio', () => {
    // 48 MP iPhone photo on a 16.7 MP device
    const r = fitCanvasLimits(8064, 6048, 16384, 16_777_216)
    expect(r.w * r.h).toBeLessThanOrEqual(16_777_216)
    expect(r.w / r.h).toBeCloseTo(8064 / 6048, 2)
  })

  it('respects the side limit for panoramas', () => {
    const r = fitCanvasLimits(40000, 2000, 16384, 64e6)
    expect(r.w).toBeLessThanOrEqual(16384)
    expect(r.h).toBe(Math.floor(2000 * (16384 / 40000)))
  })
})
