import { describe, expect, it } from 'vitest'
import { FIT_VIEW, clampView, fitScale, maxZoom, screenToWorld, worldToScreen, zoomAt } from './view'

const stage = { w: 800, h: 600 }
const bounds = { w: 4000, h: 3000 }

describe('view', () => {
  it('fits the image inside the padded stage', () => {
    expect(fitScale(stage, bounds, 50)).toBeCloseTo(500 / 3000) // height is the tighter side
    expect(fitScale({ w: 400, h: 800 }, bounds, 0)).toBeCloseTo(0.1)
  })

  it('converts between world and screen', () => {
    const scale = 0.2
    const p = { x: 123, y: -45 }
    const s = worldToScreen(p, { zoom: 1, cx: 10, cy: 20 }, scale, stage)
    const back = screenToWorld(s, { zoom: 1, cx: 10, cy: 20 }, scale, stage)
    expect(back.x).toBeCloseTo(p.x)
    expect(back.y).toBeCloseTo(p.y)
    expect(worldToScreen({ x: 0, y: 0 }, FIT_VIEW, scale, stage)).toEqual({ x: 400, y: 300 })
  })

  it('zooms around the pointer', () => {
    const fit = 0.175
    const anchor = { x: 600, y: 150 }
    const before = screenToWorld(anchor, FIT_VIEW, fit, stage)
    const v = zoomAt(FIT_VIEW, 3, anchor, stage, fit, bounds)
    expect(v.zoom).toBe(3)
    const after = screenToWorld(anchor, v, fit * v.zoom, stage)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })

  it('cannot zoom out past fit, and fit is always centred', () => {
    const v = zoomAt({ zoom: 2, cx: 500, cy: 300 }, 0.1, { x: 0, y: 0 }, stage, 0.175, bounds)
    expect(v).toEqual(FIT_VIEW)
  })

  it('limits zoom and panning', () => {
    const fit = 0.175
    expect(clampView({ zoom: 1e6, cx: 0, cy: 0 }, bounds, fit).zoom).toBe(maxZoom(fit))
    const v = clampView({ zoom: 4, cx: 99999, cy: -99999 }, bounds, fit)
    expect(v.cx).toBe(2000)
    expect(v.cy).toBe(-1500)
    expect(maxZoom(1)).toBe(8)
    expect(maxZoom(10)).toBe(4) // tiny icons can still be zoomed a bit
  })
})
