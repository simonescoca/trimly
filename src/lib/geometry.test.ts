import { describe, expect, it } from 'vitest'
import {
  cosSin,
  fitRect,
  flipRectX,
  flipRectY,
  maxRectWithAspect,
  moveRect,
  placeRect,
  pointInImage,
  rectCenter,
  rectInImage,
  reshapeRect,
  resizeRect,
  rotateRect90,
  rotatedBounds,
  type Handle,
  type ImageFrame,
  type Rect,
} from './geometry'

const deg = (d: number) => (d * Math.PI) / 180
const img = (angleDeg = 0, w = 400, h = 300): ImageFrame => ({ w, h, angle: deg(angleDeg) })
const full = (i: ImageFrame): Rect => ({ x: -i.w / 2, y: -i.h / 2, w: i.w, h: i.h })
const close = (a: Rect, b: Rect, digits = 6) => {
  expect(a.x).toBeCloseTo(b.x, digits)
  expect(a.y).toBeCloseTo(b.y, digits)
  expect(a.w).toBeCloseTo(b.w, digits)
  expect(a.h).toBeCloseTo(b.h, digits)
}

// Small deterministic PRNG so failures are reproducible.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

describe('basics', () => {
  it('uses exact cos/sin for right angles', () => {
    expect(cosSin(0)).toEqual([1, 0])
    expect(cosSin(Math.PI / 2)).toEqual([0, 1])
    expect(cosSin(Math.PI)).toEqual([-1, 0])
    expect(cosSin(-Math.PI / 2)).toEqual([0, -1])
  })

  it('knows which points are inside a rotated image', () => {
    expect(pointInImage({ x: 200, y: 150 }, img(0))).toBe(true)
    expect(pointInImage({ x: 201, y: 0 }, img(0))).toBe(false)
    // Rotated 90°: the image is now 300 wide and 400 tall.
    expect(pointInImage({ x: 150, y: 200 }, img(90))).toBe(true)
    expect(pointInImage({ x: 200, y: 0 }, img(90))).toBe(false)
    // Rotated 45°: the corner direction is outside, the diagonal axis reaches further.
    expect(pointInImage({ x: 190, y: 140 }, img(45))).toBe(false)
    expect(pointInImage({ x: 0, y: 170 }, img(45))).toBe(true)
  })

  it('computes the bounding box of a rotated image', () => {
    expect(rotatedBounds(img(0))).toEqual({ w: 400, h: 300 })
    expect(rotatedBounds(img(90))).toEqual({ w: 300, h: 400 })
    const b = rotatedBounds(img(30))
    expect(b.w).toBeCloseTo(400 * Math.cos(deg(30)) + 300 * Math.sin(deg(30)))
  })
})

describe('maxRectWithAspect', () => {
  it('is the whole image for the image ratio', () => {
    close(maxRectWithAspect(4 / 3, img(0)), full(img(0)))
  })

  it('fits the short side for a square', () => {
    close(maxRectWithAspect(1, img(0)), { x: -150, y: -150, w: 300, h: 300 })
    close(maxRectWithAspect(1, img(90)), { x: -150, y: -150, w: 300, h: 300 })
  })

  it('is tight and inside when the image is straightened', () => {
    for (const a of [-45, -30, -7.5, 3, 12, 44.9]) {
      const i = img(a)
      const r = maxRectWithAspect(4 / 3, i)
      expect(rectInImage(r, i)).toBe(true)
      // 0.1% bigger must not fit: the rectangle is really the largest.
      const bigger = { x: r.x * 1.001, y: r.y * 1.001, w: r.w * 1.001, h: r.h * 1.001 }
      expect(rectInImage(bigger, i)).toBe(false)
    }
  })
})

describe('moveRect', () => {
  const small: Rect = { x: -50, y: -50, w: 100, h: 100 }

  it('moves freely inside the image', () => {
    close(moveRect(small, 30, -20, img(0)), { x: -20, y: -70, w: 100, h: 100 })
  })

  it('stops exactly at the edges', () => {
    close(moveRect(small, 1000, 0, img(0)), { x: 100, y: -50, w: 100, h: 100 })
    close(moveRect(small, 0, -1000, img(0)), { x: -50, y: -150, w: 100, h: 100 })
  })

  it('slides along a wall when dragged diagonally into it', () => {
    const r = moveRect(small, 1000, 40, img(0))
    expect(r.x).toBeCloseTo(100)
    expect(r.y).toBeCloseTo(-10)
  })

  it('never leaves a rotated image (random walk)', () => {
    const rand = rng(1)
    for (const a of [0, 90, 7, -23, 41]) {
      const i = img(a)
      let r = fitRect(small, i)
      for (let n = 0; n < 300; n++) {
        r = moveRect(r, (rand() - 0.5) * 200, (rand() - 0.5) * 200, i)
        expect(rectInImage(r, i)).toBe(true)
        expect(r.w).toBeCloseTo(100)
      }
    }
  })
})

describe('resizeRect (free)', () => {
  const opts = (angle = 0) => ({ img: img(angle), aspect: null, minSize: 10 })
  const r0: Rect = { x: -100, y: -50, w: 200, h: 100 }

  it('moves only the grabbed edges', () => {
    close(resizeRect(r0, 'e', 30, 99, opts()), { x: -100, y: -50, w: 230, h: 100 })
    close(resizeRect(r0, 'n', 99, -20, opts()), { x: -100, y: -70, w: 200, h: 120 })
    close(resizeRect(r0, 'sw', -10, 10, opts()), { x: -110, y: -50, w: 210, h: 110 })
  })

  it('stops at the image edges', () => {
    close(resizeRect(r0, 'se', 1000, 1000, opts()), { x: -100, y: -50, w: 300, h: 200 })
    close(resizeRect(r0, 'nw', -1000, -1000, opts()), { x: -200, y: -150, w: 300, h: 200 })
  })

  it('respects the minimum size and never flips', () => {
    const r = resizeRect(r0, 'e', -1000, 0, opts())
    expect(r.w).toBe(10)
    expect(r.x).toBe(-100)
    const l = resizeRect(r0, 'w', 1000, 0, opts())
    expect(l.w).toBe(10)
    expect(l.x + l.w).toBeCloseTo(100)
  })
})

describe('resizeRect (locked ratio)', () => {
  const handles: Handle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

  it('keeps the ratio and stays inside for any drag (random)', () => {
    const rand = rng(7)
    for (const a of [0, 90, -12, 33]) {
      const i = img(a)
      for (const aspect of [1, 16 / 9, 4 / 5]) {
        let r = placeRect({ x: 0, y: 0 }, 60 * aspect, 60, i)
        for (let n = 0; n < 200; n++) {
          const h = handles[Math.floor(rand() * handles.length)]
          r = resizeRect(r, h, (rand() - 0.5) * 300, (rand() - 0.5) * 300, { img: i, aspect, minSize: 8 })
          expect(r.w / r.h).toBeCloseTo(aspect, 6)
          expect(rectInImage(r, i)).toBe(true)
          expect(Math.min(r.w, r.h)).toBeGreaterThanOrEqual(8 - 1e-9)
        }
      }
    }
  })

  it('keeps the opposite corner still when dragging a corner', () => {
    const r0: Rect = { x: -50, y: -50, w: 100, h: 100 }
    const r = resizeRect(r0, 'se', 20, 20, { img: img(0), aspect: 1, minSize: 10 })
    close(r, { x: -50, y: -50, w: 120, h: 120 })
    const l = resizeRect(r0, 'nw', 20, 20, { img: img(0), aspect: 1, minSize: 10 })
    close(l, { x: -30, y: -30, w: 80, h: 80 })
  })

  it('grows a square until it touches the short side', () => {
    const r0: Rect = { x: -50, y: -50, w: 100, h: 100 }
    const r = resizeRect(r0, 'se', 1000, 1000, { img: img(0), aspect: 1, minSize: 10 })
    close(r, { x: -50, y: -50, w: 200, h: 200 })
  })

  it('keeps the centre line when dragging a side', () => {
    const r0: Rect = { x: -50, y: -50, w: 100, h: 100 }
    const r = resizeRect(r0, 'e', 40, 0, { img: img(0), aspect: 1, minSize: 10 })
    close(r, { x: -50, y: -70, w: 140, h: 140 })
  })
})

describe('fitRect / placeRect / reshapeRect', () => {
  it('returns a fitting rect unchanged', () => {
    const r = { x: -10, y: -10, w: 20, h: 20 }
    expect(fitRect(r, img(0))).toBe(r)
  })

  it('shrinks the full image around the centre when straightening', () => {
    for (const a of [5, -5, 20, 45]) {
      const i = img(a)
      const r = fitRect(full(img(0)), i)
      expect(rectInImage(r, i)).toBe(true)
      expect(r.w / r.h).toBeCloseTo(4 / 3)
      expect(rectCenter(r).x).toBeCloseTo(0)
      expect(rectCenter(r).y).toBeCloseTo(0)
    }
  })

  it('moves a rect back inside before shrinking it', () => {
    const r = placeRect({ x: 180, y: 0 }, 100, 100, img(0))
    close(r, { x: 100, y: -50, w: 100, h: 100 })
  })

  it('keeps a full-image crop full-size across ratio changes', () => {
    const i = img(0)
    const square = reshapeRect(full(i), 4 / 3, 1, i)
    close(square, { x: -150, y: -150, w: 300, h: 300 })
    const wide = reshapeRect(square, 1, 16 / 9, i)
    expect(wide.w).toBeCloseTo(400)
    const tall = reshapeRect(wide, 16 / 9, 9 / 16, i)
    expect(tall.h).toBeCloseTo(300)
    const wideAgain = reshapeRect(tall, 9 / 16, 16 / 9, i)
    expect(wideAgain.w).toBeCloseTo(400) // no shrinking when switching back and forth
  })

  it('keeps the framing of a small crop when switching ratio', () => {
    const i = img(0)
    const face: Rect = { x: 60, y: -100, w: 80, h: 60 } // small crop, top right
    const sq = reshapeRect(face, 4 / 3, 1, i)
    expect(rectCenter(sq).x).toBeCloseTo(100)
    expect(rectCenter(sq).y).toBeCloseTo(-70)
    expect(sq.w * sq.h).toBeLessThan(0.2 * 300 * 300)
  })
})

describe('rotate and flip', () => {
  const r: Rect = { x: 10, y: -40, w: 120, h: 70 }

  it('rotating four times is the identity; cw then ccw too', () => {
    close(rotateRect90(rotateRect90(rotateRect90(rotateRect90(r, 1), 1), 1), 1), r)
    close(rotateRect90(rotateRect90(r, 1), -1), r)
  })

  it('a crop inside the image stays inside after rotating both', () => {
    const i = img(0)
    const i90 = img(90)
    expect(rectInImage(r, i)).toBe(true)
    expect(rectInImage(rotateRect90(r, 1), i90)).toBe(true)
    expect(rectInImage(rotateRect90(r, -1), img(-90))).toBe(true)
  })

  it('moves the crop to the same spot on the rotated image', () => {
    // Top-right area of a landscape image ends up bottom-right after a clockwise turn.
    const topRight: Rect = { x: 100, y: -150, w: 100, h: 100 }
    const c = rectCenter(rotateRect90(topRight, 1))
    expect(c.x).toBeCloseTo(100)
    expect(c.y).toBeCloseTo(150)
  })

  it('flipping twice is the identity and mirrors the position', () => {
    close(flipRectX(flipRectX(r)), r)
    close(flipRectY(flipRectY(r)), r)
    expect(rectCenter(flipRectX(r)).x).toBeCloseTo(-rectCenter(r).x)
    expect(rectCenter(flipRectY(r)).y).toBeCloseTo(-rectCenter(r).y)
  })
})
