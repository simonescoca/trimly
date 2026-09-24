import type { LoadedImage } from './decode'
import type { Doc, Shape } from '../state/editor'
import { angleOf } from '../state/editor'

export type ImageTransform = Pick<Doc, 'rot90' | 'straighten' | 'flipX' | 'flipY'>

/**
 * Draws the image in world coordinates: the context's current transform must map world → target.
 * Shared by the on-screen stage and the export, so what you see is what you get.
 */
export function drawWorldImage(ctx: CanvasRenderingContext2D, image: LoadedImage, t: ImageTransform, useFullResolution: boolean) {
  ctx.save()
  ctx.rotate(angleOf(t))
  ctx.scale(t.flipX ? -1 : 1, t.flipY ? -1 : 1)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const src = useFullResolution ? image.source : image.preview
  ctx.drawImage(src, -image.width / 2, -image.height / 2, image.width, image.height)
  ctx.restore()
}

/** Corner radius in px for the rounded shape. */
export const cornerRadius = (w: number, h: number, roundness: number) => (Math.min(w, h) / 2) * (roundness / 100)

/**
 * Adds the outline of `shape` to the current path (no beginPath/fill).
 * `radius` overrides the corner radius (used to keep a border concentric).
 */
export function shapePath(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, w: number, h: number, roundness: number, radius?: number) {
  if (shape === 'circle') {
    ctx.ellipse(x + w / 2, y + h / 2, Math.max(0, w / 2), Math.max(0, h / 2), 0, 0, Math.PI * 2)
    return
  }
  const r = shape === 'rounded' ? Math.min(radius ?? cornerRadius(w, h, roundness), w / 2, h / 2) : 0
  if (r <= 0) {
    ctx.rect(x, y, w, h)
    return
  }
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
