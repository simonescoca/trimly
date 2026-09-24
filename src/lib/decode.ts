import { context2d, createCanvas, hasTransparency, resample } from './canvas'
import { MAY_HAVE_ALPHA, baseName, formatFromFileInfo, sniffFormat, type ImageFormat } from './formats'
import { fitCanvasLimits } from './limits'

export type DecodeErrorCode = 'notImage' | 'unsupported' | 'corrupt' | 'empty' | 'decoderOffline'

export class DecodeError extends Error {
  readonly code: DecodeErrorCode
  constructor(code: DecodeErrorCode, cause?: unknown) {
    super(code, { cause })
    this.code = code
  }
}

export type LoadedImage = {
  id: number
  /** Full-resolution pixels, orientation already applied. */
  source: CanvasImageSource
  width: number
  height: number
  /** Smaller copy for fast on-screen drawing (may be `source` itself). */
  preview: CanvasImageSource
  /** preview width / source width (≤ 1). */
  previewScale: number
  name: string
  format: ImageFormat
  hasAlpha: boolean
  /** Set when the original exceeded what this device can handle. */
  downscaledFrom?: { width: number; height: number }
  dispose: () => void
}

type Raw = { source: CanvasImageSource; width: number; height: number; cleanup: () => void }

const PREVIEW_MAX_SIDE = 2560
/** SVGs have no pixel size of their own: rasterise so the long side is at least this. */
const SVG_TARGET_SIDE = 2048
/** Formats that can be animated: freeze the first frame so the stage and export always match. */
const FREEZE: ReadonlySet<ImageFormat> = new Set(['gif', 'png', 'webp', 'avif'])

let nextId = 1

export async function decodeImage(file: File, onConverting?: (format: ImageFormat) => void): Promise<LoadedImage> {
  if (file.size === 0) throw new DecodeError('empty')

  const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer())
  const sniffed = sniffFormat(head)
  const format = sniffed ?? formatFromFileInfo(file.name, file.type)
  if (!format) throw new DecodeError('notImage')

  let raw: Raw
  if (format === 'svg') {
    raw = await decodeSvg(file)
  } else if (format === 'heic' || format === 'tiff') {
    // Safari opens both natively; elsewhere load a decoder on demand.
    raw = await decodeNative(file).catch(() => {
      onConverting?.(format)
      return format === 'heic' ? decodeHeic(file) : decodeTiff(file)
    })
  } else {
    raw = await decodeNative(file).catch((error) => {
      throw new DecodeError(!sniffed ? 'corrupt' : format === 'avif' ? 'unsupported' : 'corrupt', error)
    })
  }

  return finish(raw, file.name, format)
}

function finish(raw: Raw, fileName: string, format: ImageFormat): LoadedImage {
  let { source, width, height, cleanup } = raw
  let downscaledFrom: LoadedImage['downscaledFrom']

  const fit = fitCanvasLimits(width, height)
  if (fit.scale < 1) {
    const canvas = resample(source, width, height, fit.w, fit.h)
    cleanup()
    downscaledFrom = { width, height }
    ;({ source, width, height } = { source: canvas, width: fit.w, height: fit.h })
    cleanup = () => releaseCanvas(canvas)
  } else if (FREEZE.has(format) && !(source instanceof HTMLCanvasElement)) {
    const canvas = createCanvas(width, height)
    context2d(canvas).drawImage(source, 0, 0, width, height)
    cleanup()
    source = canvas
    cleanup = () => releaseCanvas(canvas)
  }

  const previewScale = Math.min(1, PREVIEW_MAX_SIDE / Math.max(width, height))
  const preview = previewScale < 1 ? resample(source, width, height, width * previewScale, height * previewScale) : source

  let hasAlpha = false
  if (MAY_HAVE_ALPHA.has(format)) {
    const probeScale = Math.min(1, 512 / Math.max(width, height))
    const probe = resample(source, width, height, width * probeScale, height * probeScale)
    hasAlpha = hasTransparency(probe)
    releaseCanvas(probe)
  }

  return {
    id: nextId++,
    source,
    width,
    height,
    preview,
    previewScale: previewScale < 1 ? (preview as HTMLCanvasElement).width / width : 1,
    name: baseName(fileName),
    format,
    hasAlpha,
    downscaledFrom,
    dispose: () => {
      cleanup()
      if (preview !== source) releaseCanvas(preview as HTMLCanvasElement)
    },
  }
}

/** Shrinking a canvas to 0×0 frees its memory right away (important on iOS). */
function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0
  canvas.height = 0
}

async function decodeNative(blob: Blob): Promise<Raw> {
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.decoding = 'async'
  img.src = url
  try {
    await img.decode()
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('image has no size')
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, cleanup: () => URL.revokeObjectURL(url) }
}

const LENGTH_UNITS: Record<string, number> = { '': 1, px: 1, pt: 4 / 3, pc: 16, in: 96, cm: 96 / 2.54, mm: 96 / 25.4 }

/** SVG length in px, or null for relative units (%, em…) and garbage. */
export function parseSvgLength(value: string | null): number | null {
  const m = value?.trim().match(/^([0-9]*\.?[0-9]+(?:e[+-]?\d+)?)\s*([a-z]*)$/i)
  if (!m) return null
  const unit = LENGTH_UNITS[m[2].toLowerCase()]
  const n = Number(m[1]) * (unit ?? NaN)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Intrinsic size from width/height, falling back to the viewBox, then to a square. */
export function svgIntrinsicSize(width: string | null, height: string | null, viewBox: string | null): { w: number; h: number } {
  const vb = viewBox?.trim().split(/[\s,]+/).map(Number)
  const vbw = vb && vb.length === 4 && vb[2] > 0 ? vb[2] : null
  const vbh = vb && vb.length === 4 && vb[3] > 0 ? vb[3] : null
  let w = parseSvgLength(width)
  let h = parseSvgLength(height)
  if (w && !h) h = vbw && vbh ? (w * vbh) / vbw : w
  if (h && !w) w = vbw && vbh ? (h * vbw) / vbh : h
  if (w && h) return { w, h }
  if (vbw && vbh) return { w: vbw, h: vbh }
  return { w: 1024, h: 1024 }
}

async function decodeSvg(file: File): Promise<Raw> {
  const doc = new DOMParser().parseFromString(await file.text(), 'image/svg+xml')
  const svg = doc.documentElement
  if (svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) throw new DecodeError('corrupt')

  const { w, h } = svgIntrinsicSize(svg.getAttribute('width'), svg.getAttribute('height'), svg.getAttribute('viewBox'))
  const scale = Math.min(16, Math.max(1, SVG_TARGET_SIDE / Math.max(w, h)))
  const target = fitCanvasLimits(w * scale, h * scale)

  // Give the SVG an explicit pixel size (Firefox can't draw size-less SVGs) and keep its content scaling.
  if (!svg.hasAttribute('viewBox')) svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.setAttribute('width', String(target.w))
  svg.setAttribute('height', String(target.h))
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })

  const img = await decodeNative(blob).catch((error) => {
    throw new DecodeError('corrupt', error)
  })
  const canvas = createCanvas(target.w, target.h)
  context2d(canvas).drawImage(img.source, 0, 0, target.w, target.h)
  img.cleanup()
  return { source: canvas, width: target.w, height: target.h, cleanup: () => releaseCanvas(canvas) }
}

async function decodeHeic(file: File): Promise<Raw> {
  let heicTo: typeof import('heic-to/csp').heicTo
  try {
    ;({ heicTo } = await import('heic-to/csp'))
  } catch (error) {
    throw new DecodeError('decoderOffline', error)
  }
  try {
    const bitmap = await heicTo({ blob: file, type: 'bitmap' })
    return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() }
  } catch (error) {
    throw new DecodeError('corrupt', error)
  }
}

async function decodeTiff(file: File): Promise<Raw> {
  let UTIF: typeof import('utif2')
  try {
    const mod = await import('utif2')
    UTIF = (mod as unknown as { default?: typeof import('utif2') }).default ?? mod
  } catch (error) {
    throw new DecodeError('decoderOffline', error)
  }
  try {
    const buffer = await file.arrayBuffer()
    const ifds = UTIF.decode(buffer)
    // Pick the largest page (some TIFFs start with a thumbnail).
    const ifd = ifds.reduce((best, cur) => {
      const size = (i: typeof cur) => Number((i.t256 as number[] | undefined)?.[0] ?? 0) * Number((i.t257 as number[] | undefined)?.[0] ?? 0)
      return size(cur) > size(best) ? cur : best
    })
    UTIF.decodeImage(buffer, ifd)
    const { width, height } = ifd
    if (!width || !height) throw new Error('empty TIFF')
    const rgba = UTIF.toRGBA8(ifd)
    const canvas = createCanvas(width, height)
    context2d(canvas).putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer as ArrayBuffer, rgba.byteOffset, width * height * 4), width, height), 0, 0)
    return { source: canvas, width, height, cleanup: () => releaseCanvas(canvas) }
  } catch (error) {
    throw new DecodeError('corrupt', error)
  }
}
