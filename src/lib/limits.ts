// Browsers cap canvas size; iOS/iPadOS Safari is the strictest (16.7 megapixels).
// Exceeding the cap silently produces a blank canvas, so we stay under it.
const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
export const IS_IOS =
  /iPhone|iPad|iPod/.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const MAX_CANVAS_SIDE = IS_IOS ? 8192 : 16384
export const MAX_CANVAS_AREA = IS_IOS ? 16_777_216 : 64_000_000

/** Largest size with the same aspect ratio that fits the canvas limits (never enlarges). */
export function fitCanvasLimits(w: number, h: number, maxSide = MAX_CANVAS_SIDE, maxArea = MAX_CANVAS_AREA): { w: number; h: number; scale: number } {
  const scale = Math.min(1, maxSide / w, maxSide / h, Math.sqrt(maxArea / (w * h)))
  return { w: Math.max(1, Math.floor(w * scale)), h: Math.max(1, Math.floor(h * scale)), scale }
}
