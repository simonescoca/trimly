// Crop geometry. Everything lives in "world" coordinates:
//   - origin at the centre of the image, y pointing down, 1 unit = 1 source pixel;
//   - the image is rotated by `angle` (radians, clockwise) around the origin;
//   - the crop rectangle is always axis-aligned in world space.
// A crop is valid when its four corners lie inside the rotated image.

export type Vec = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }
export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
/** The image as placed in the world. Flips don't change its outline, so they're not needed here. */
export type ImageFrame = { w: number; h: number; angle: number }

// Two tolerances: searches aim strictly inside (SEARCH_TOL), while validity accepts a little more
// (ACCEPT_TOL). The gap absorbs float noise when a result is recomputed, e.g. `cy - h / 2`.
const ACCEPT_TOL = 1e-9
const SEARCH_TOL = 1e-10
const SEARCH_STEPS = 50

/** cos/sin that are exact for multiples of 90°, so crops can sit exactly on the image edges. */
export function cosSin(angle: number): [number, number] {
  const quarter = angle / (Math.PI / 2)
  const k = Math.round(quarter)
  if (Math.abs(quarter - k) < 1e-12) {
    const table: [number, number][] = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]
    return table[((k % 4) + 4) % 4]
  }
  return [Math.cos(angle), Math.sin(angle)]
}

export function isAxisAligned(angle: number): boolean {
  const quarter = angle / (Math.PI / 2)
  return Math.abs(quarter - Math.round(quarter)) < 1e-12
}

export const rectCenter = (r: Rect): Vec => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })
export const rectAt = (c: Vec, w: number, h: number): Rect => ({ x: c.x - w / 2, y: c.y - h / 2, w, h })

export function corners(r: Rect): Vec[] {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ]
}

export function pointInImage(p: Vec, img: ImageFrame, tol = ACCEPT_TOL): boolean {
  const [c, s] = cosSin(img.angle)
  // Rotate the point back by -angle into image space.
  const u = p.x * c + p.y * s
  const v = -p.x * s + p.y * c
  return Math.abs(u) <= img.w / 2 + tol && Math.abs(v) <= img.h / 2 + tol
}

export function rectInImage(r: Rect, img: ImageFrame, tol = ACCEPT_TOL): boolean {
  return corners(r).every((p) => pointInImage(p, img, tol))
}

const fits = (r: Rect, img: ImageFrame) => rectInImage(r, img, SEARCH_TOL)
/** Last line of defence: never hand back an invalid crop. */
const orKeep = (next: Rect, previous: Rect, img: ImageFrame) => (rectInImage(next, img) ? next : previous)

/** Axis-aligned bounding box size of the rotated image. */
export function rotatedBounds(img: ImageFrame): { w: number; h: number } {
  const [c, s] = cosSin(img.angle)
  const ac = Math.abs(c)
  const as = Math.abs(s)
  return { w: img.w * ac + img.h * as, h: img.w * as + img.h * ac }
}

/** Largest k such that a (k·w × k·h) rectangle centred at the origin fits the image. */
export function maxScaleAtOrigin(w: number, h: number, img: ImageFrame): number {
  const [c, s] = cosSin(img.angle)
  const ac = Math.abs(c)
  const as = Math.abs(s)
  return Math.min(img.w / (w * ac + h * as), img.h / (w * as + h * ac))
}

/** Largest rectangle with ratio `aspect` (w/h) centred at the origin. */
export function maxRectWithAspect(aspect: number, img: ImageFrame): Rect {
  const k = maxScaleAtOrigin(aspect, 1, img)
  return rectAt({ x: 0, y: 0 }, aspect * k, k)
}

/** Largest t in [lo, hi] with ok(t) true, assuming ok(lo) and monotonic validity. */
function searchMax(ok: (t: number) => boolean, lo: number, hi: number): number {
  if (ok(hi)) return hi
  for (let i = 0; i < SEARCH_STEPS; i++) {
    const mid = (lo + hi) / 2
    if (ok(mid)) lo = mid
    else hi = mid
  }
  return lo
}

const translate = (r: Rect, dx: number, dy: number): Rect => ({ ...r, x: r.x + dx, y: r.y + dy })

/**
 * Moves the crop by (dx, dy), stopping at the image edges and sliding along them
 * (dragging diagonally into a wall keeps moving along the wall).
 */
export function moveRect(r: Rect, dx: number, dy: number, img: ImageFrame): Rect {
  const target = translate(r, dx, dy)
  if (fits(target, img)) return target
  const slide = (from: Rect, ddx: number, ddy: number) => {
    const t = searchMax((t) => fits(translate(from, ddx * t, ddy * t), img), 0, 1)
    return translate(from, ddx * t, ddy * t)
  }
  const xFirst = (() => {
    const a = slide(r, dx, 0)
    return slide(a, 0, target.y - a.y)
  })()
  const yFirst = (() => {
    const a = slide(r, 0, dy)
    return slide(a, target.x - a.x, 0)
  })()
  const dist = (p: Rect) => Math.hypot(p.x - target.x, p.y - target.y)
  return orKeep(dist(xFirst) <= dist(yFirst) ? xFirst : yFirst, r, img)
}

export type ResizeOptions = {
  img: ImageFrame
  /** Locked ratio (w/h), or null for free resizing. */
  aspect: number | null
  /** Minimum width and height, in world units. */
  minSize: number
}

/** Resizes the crop by dragging `handle` by (dx, dy); never flips and never leaves the image. */
export function resizeRect(r: Rect, handle: Handle, dx: number, dy: number, { img, aspect, minSize }: ResizeOptions): Rect {
  const west = handle.includes('w')
  const east = handle.includes('e')
  const north = handle.includes('n')
  const south = handle.includes('s')

  if (aspect === null) {
    // Free: move the grabbed edges independently, one axis at a time so we slide along walls.
    const withX = (t: number): Rect => {
      if (east) return { ...r, w: Math.max(minSize, r.w + dx * t) }
      if (west) {
        const w = Math.max(minSize, r.w - dx * t)
        return { ...r, x: r.x + r.w - w, w }
      }
      return r
    }
    const tx = searchMax((t) => fits(withX(t), img), 0, 1)
    const rx = withX(tx)
    const withY = (t: number): Rect => {
      if (south) return { ...rx, h: Math.max(minSize, rx.h + dy * t) }
      if (north) {
        const h = Math.max(minSize, rx.h - dy * t)
        return { ...rx, y: rx.y + rx.h - h, h }
      }
      return rx
    }
    const ty = searchMax((t) => fits(withY(t), img), 0, 1)
    return orKeep(withY(ty), r, img)
  }

  // Locked ratio: size is a single parameter (height), anchored on the opposite side.
  const minH = Math.max(minSize, minSize / aspect)
  let desiredH: number
  if ((east || west) && (north || south)) {
    // Corner: project the pointer movement onto the rectangle's diagonal.
    const w0 = r.w + (east ? dx : -dx)
    const h0 = r.h + (south ? dy : -dy)
    desiredH = (w0 * aspect + h0) / (aspect * aspect + 1)
  } else if (east || west) {
    desiredH = (r.w + (east ? dx : -dx)) / aspect
  } else {
    desiredH = r.h + (south ? dy : -dy)
  }
  desiredH = Math.max(minH, desiredH)

  const cx = r.x + r.w / 2
  const cy = r.y + r.h / 2
  const withH = (h: number): Rect => {
    const w = h * aspect
    const x = east ? r.x : west ? r.x + r.w - w : cx - w / 2
    const y = south ? r.y : north ? r.y + r.h - h : cy - h / 2
    return { x, y, w, h }
  }
  if (desiredH <= r.h) return orKeep(withH(desiredH), r, img) // shrinking stays inside
  const t = searchMax((t) => fits(withH(r.h + (desiredH - r.h) * t), img), 0, 1)
  return orKeep(withH(r.h + (desiredH - r.h) * t), r, img)
}

/**
 * Places a w×h rectangle as close as possible to `center`: moves it towards the image centre if
 * needed, and shrinks it (keeping its ratio) only if it can't fit anywhere.
 */
export function placeRect(center: Vec, w: number, h: number, img: ImageFrame): Rect {
  const k = Math.min(1, maxScaleAtOrigin(w, h, img))
  const sw = w * k
  const sh = h * k
  const at = (t: number) => rectAt({ x: center.x * t, y: center.y * t }, sw, sh)
  if (fits(at(1), img)) return at(1)
  // Validity along the path from the origin to `center` is monotonic for a convex image.
  return at(searchMax((t) => fits(at(t), img), 0, 1))
}

/** Returns `r` unchanged if it fits, otherwise the closest fitting rectangle of the same ratio. */
export function fitRect(r: Rect, img: ImageFrame): Rect {
  if (rectInImage(r, img)) return r
  return placeRect(rectCenter(r), r.w, r.h, img)
}

/**
 * Crop for a new ratio that keeps the current framing: same centre and same share of the
 * largest possible crop (so a full-image crop stays full-image when switching ratios).
 */
export function reshapeRect(r: Rect, currentAspect: number, nextAspect: number, img: ImageFrame): Rect {
  const maxNow = maxRectWithAspect(currentAspect, img)
  const fill = Math.min(1, (r.w * r.h) / (maxNow.w * maxNow.h))
  const maxNext = maxRectWithAspect(nextAspect, img)
  const k = Math.sqrt(fill)
  return placeRect(rectCenter(r), maxNext.w * k, maxNext.h * k, img)
}

/** The crop follows a 90° rotation of the image: cw = +1, ccw = -1. */
export function rotateRect90(r: Rect, dir: 1 | -1): Rect {
  return dir === 1 ? { x: -(r.y + r.h), y: r.x, w: r.h, h: r.w } : { x: r.y, y: -(r.x + r.w), w: r.h, h: r.w }
}

export const flipRectX = (r: Rect): Rect => ({ ...r, x: -r.x - r.w })
export const flipRectY = (r: Rect): Rect => ({ ...r, y: -r.y - r.h })
