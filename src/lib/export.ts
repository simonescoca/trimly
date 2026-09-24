import type { Doc } from '../state/editor'
import { canvasToBlob, context2d, createCanvas, resample } from './canvas'
import type { LoadedImage } from './decode'
import { fitCanvasLimits } from './limits'
import { cornerRadius, drawWorldImage, shapePath } from './render'

export type OutputFormat = 'png' | 'jpeg' | 'webp'
export type SizeOption = { mode: 'original' } | { mode: 'custom'; width: number }
export type ExportOptions = {
  /** null = follow the recommendation (changes with the shape/background). */
  format: OutputFormat | null
  /** 0–1, for JPG and WebP. */
  quality: number
  size: SizeOption
}

export const DEFAULT_EXPORT: ExportOptions = { format: null, quality: 0.92, size: { mode: 'original' } }
export const MIME: Record<OutputFormat, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }
export const EXTENSION: Record<OutputFormat, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' }
export const FORMAT_NAME: Record<OutputFormat, string> = { png: 'PNG', jpeg: 'JPG', webp: 'WebP' }

let webpSupport: boolean | undefined
/** Safari (and some older browsers) silently return PNG when asked for WebP. */
export function canEncodeWebp(): boolean {
  if (webpSupport === undefined) {
    try {
      webpSupport = createCanvas(1, 1).toDataURL('image/webp').startsWith('data:image/webp')
    } catch {
      webpSupport = false
    }
  }
  return webpSupport
}

/** Background and border only exist for shapes that have an "outside". */
export const isStyled = (doc: Pick<Doc, 'shape'>) => doc.shape !== 'rect'

/** Will the result contain transparent pixels? */
export function needsTransparency(image: Pick<LoadedImage, 'hasAlpha'>, doc: Pick<Doc, 'shape' | 'background'>): boolean {
  return (isStyled(doc) && doc.background === null) || (image.hasAlpha && !(isStyled(doc) && doc.background !== null))
}

export function recommendedFormat(image: Pick<LoadedImage, 'hasAlpha' | 'format'>, doc: Pick<Doc, 'shape' | 'background'>): OutputFormat {
  if (needsTransparency(image, doc)) return 'png'
  if (image.format === 'webp' && canEncodeWebp()) return 'webp'
  // Graphics (logos, screenshots, icons) stay lossless; photos become JPG.
  if (image.format === 'png' || image.format === 'gif' || image.format === 'svg' || image.format === 'ico') return 'png'
  return 'jpeg'
}

export const resolveFormat = (options: ExportOptions, image: Pick<LoadedImage, 'hasAlpha' | 'format'>, doc: Pick<Doc, 'shape' | 'background'>): OutputFormat => {
  const f = options.format ?? recommendedFormat(image, doc)
  return f === 'webp' && !canEncodeWebp() ? 'png' : f
}

export type OutputSize = { w: number; h: number; limited: boolean; upscaled: boolean }

export function outputSize(crop: Pick<Doc['crop'], 'w' | 'h'>, size: SizeOption): OutputSize {
  const nativeW = Math.max(1, Math.round(crop.w))
  const nativeH = Math.max(1, Math.round(crop.h))
  let w = nativeW
  let h = nativeH
  if (size.mode === 'custom') {
    w = Math.max(1, Math.round(size.width))
    h = Math.max(1, Math.round((size.width * crop.h) / crop.w))
  }
  const fit = fitCanvasLimits(w, h)
  return { w: fit.w, h: fit.h, limited: fit.scale < 1, upscaled: fit.w > nativeW }
}

/**
 * Renders the final image: crop + rotation + flips, then the shape mask, background and border.
 * `full` = use the full-resolution source (export) or the screen preview (live preview).
 */
export function renderOutput(image: LoadedImage, doc: Doc, w: number, h: number, full = true): HTMLCanvasElement {
  const { crop } = doc
  // When shrinking a lot, draw bigger first and step down: sharper than one big reduction.
  const native = fitCanvasLimits(crop.w, crop.h)
  const k = Math.min(native.w / w, 4)
  const rw = full && k >= 2 ? Math.round(w * k) : w
  const rh = full && k >= 2 ? Math.round(h * k) : h

  let canvas = createCanvas(rw, rh)
  const ctx = context2d(canvas)
  ctx.setTransform(rw / crop.w, 0, 0, rh / crop.h, (-crop.x * rw) / crop.w, (-crop.y * rh) / crop.h)
  drawWorldImage(ctx, image, doc, full)
  if (rw !== w) {
    const small = resample(canvas, rw, rh, w, h)
    canvas.width = canvas.height = 0
    canvas = small
  }
  if (!isStyled(doc)) return canvas

  // Cut out the shape.
  const out = context2d(canvas)
  out.setTransform(1, 0, 0, 1, 0, 0)
  out.globalCompositeOperation = 'destination-in'
  out.beginPath()
  shapePath(out, doc.shape, 0, 0, w, h, doc.roundness)
  out.fill()
  out.globalCompositeOperation = 'source-over'

  // Colour outside the shape.
  if (doc.background) {
    const withBg = createCanvas(w, h)
    const bg = context2d(withBg)
    bg.fillStyle = doc.background
    bg.fillRect(0, 0, w, h)
    bg.drawImage(canvas, 0, 0)
    canvas.width = canvas.height = 0
    canvas = withBg
  }

  // Border, drawn inside the shape's edge.
  const bw = doc.borderWidth * Math.min(w, h)
  if (bw > 0) {
    const b = context2d(canvas)
    b.beginPath()
    const radius = Math.max(0, cornerRadius(w, h, doc.roundness) - bw / 2)
    shapePath(b, doc.shape, bw / 2, bw / 2, w - bw, h - bw, doc.roundness, radius)
    b.lineWidth = bw
    b.strokeStyle = doc.borderColor
    b.stroke()
  }
  return canvas
}

/** Encodes a canvas; JPG can't store transparency, so it's flattened on white (or the chosen background). */
export async function encodeCanvas(canvas: HTMLCanvasElement, format: OutputFormat, quality: number, matte = '#ffffff'): Promise<Blob> {
  if (format !== 'jpeg') return canvasToBlob(canvas, MIME[format], format === 'png' ? undefined : quality)
  const flat = createCanvas(canvas.width, canvas.height)
  const ctx = context2d(flat)
  ctx.fillStyle = matte
  ctx.fillRect(0, 0, flat.width, flat.height)
  ctx.drawImage(canvas, 0, 0)
  try {
    return await canvasToBlob(flat, MIME.jpeg, quality)
  } finally {
    flat.width = flat.height = 0
  }
}

export const outputFileName = (image: Pick<LoadedImage, 'name'>, format: OutputFormat) => `${image.name}-cropped.${EXTENSION[format]}`

export type ExportResult = { blob: Blob; name: string; format: OutputFormat; w: number; h: number }

export async function exportImage(image: LoadedImage, doc: Doc, options: ExportOptions): Promise<ExportResult> {
  const format = resolveFormat(options, image, doc)
  const { w, h } = outputSize(doc.crop, options.size)
  const canvas = renderOutput(image, doc, w, h, true)
  try {
    const blob = await encodeCanvas(canvas, format, options.quality, (isStyled(doc) && doc.background) || '#ffffff')
    return { blob, name: outputFileName(image, format), format, w, h }
  } finally {
    canvas.width = canvas.height = 0
  }
}

export function formatBytes(bytes: number, locale: string): string {
  const units = ['B', 'KB', 'MB']
  let v = bytes
  let i = 0
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  return `${v.toLocaleString(locale, { maximumFractionDigits: v < 10 && i > 0 ? 1 : 0 })} ${units[i]}`
}
