export function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

export function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return ctx
}

/**
 * High-quality downscale: halves repeatedly, then does the final resize.
 * A single big drawImage reduction skips pixels and looks jagged in some browsers.
 */
export function resample(source: CanvasImageSource, sw: number, sh: number, tw: number, th: number): HTMLCanvasElement {
  tw = Math.max(1, Math.round(tw))
  th = Math.max(1, Math.round(th))
  let current: CanvasImageSource = source
  let cw = sw
  let ch = sh
  while (cw / 2 >= tw && ch / 2 >= th) {
    const nw = Math.round(cw / 2)
    const nh = Math.round(ch / 2)
    const step = createCanvas(nw, nh)
    context2d(step).drawImage(current, 0, 0, cw, ch, 0, 0, nw, nh)
    current = step
    cw = nw
    ch = nh
  }
  const out = createCanvas(tw, th)
  context2d(out).drawImage(current, 0, 0, cw, ch, 0, 0, tw, th)
  return out
}

/** True if any pixel of the (small) canvas is not fully opaque. */
export function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const { data } = context2d(canvas).getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true
  return false
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), type, quality)
  })
}
