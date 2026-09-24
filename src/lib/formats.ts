export type ImageFormat = 'jpeg' | 'png' | 'gif' | 'webp' | 'bmp' | 'tiff' | 'heic' | 'avif' | 'svg' | 'ico'

export const FORMAT_LABEL: Record<ImageFormat, string> = {
  jpeg: 'JPG',
  png: 'PNG',
  gif: 'GIF',
  webp: 'WebP',
  bmp: 'BMP',
  tiff: 'TIFF',
  heic: 'HEIC',
  avif: 'AVIF',
  svg: 'SVG',
  ico: 'ICO',
}

/** Formats that may contain transparent pixels. */
export const MAY_HAVE_ALPHA: ReadonlySet<ImageFormat> = new Set(['png', 'gif', 'webp', 'tiff', 'heic', 'avif', 'svg', 'ico', 'bmp'])

/** What the file picker offers. `image/*` alone hides HEIC/TIFF on some systems. */
export const ACCEPT = 'image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tif,.tiff,.heic,.heif,.avif,.svg,.ico'

const EXTENSIONS: Record<string, ImageFormat> = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  jfif: 'jpeg',
  png: 'png',
  apng: 'png',
  gif: 'gif',
  webp: 'webp',
  bmp: 'bmp',
  dib: 'bmp',
  tif: 'tiff',
  tiff: 'tiff',
  heic: 'heic',
  heif: 'heic',
  hif: 'heic',
  avif: 'avif',
  svg: 'svg',
  ico: 'ico',
  cur: 'ico',
}

const MIME: Record<string, ImageFormat> = {
  'image/jpeg': 'jpeg',
  'image/pjpeg': 'jpeg',
  'image/png': 'png',
  'image/apng': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/heic': 'heic',
  'image/heif': 'heic',
  'image/heic-sequence': 'heic',
  'image/heif-sequence': 'heic',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
}

const ascii = (b: Uint8Array, start: number, end: number) => String.fromCharCode(...b.subarray(start, end))
const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v)

/** Identifies an image by its first bytes (4 KB is plenty). Returns null when unknown. */
export function sniffFormat(b: Uint8Array): ImageFormat | null {
  if (startsWith(b, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (ascii(b, 0, 6) === 'GIF87a' || ascii(b, 0, 6) === 'GIF89a') return 'gif'
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return 'webp'
  if (startsWith(b, [0x49, 0x49, 0x2a, 0x00]) || startsWith(b, [0x4d, 0x4d, 0x00, 0x2a])) return 'tiff'
  if (ascii(b, 4, 8) === 'ftyp') return sniffIsoBrand(b)
  if (startsWith(b, [0x00, 0x00, 0x01, 0x00]) || startsWith(b, [0x00, 0x00, 0x02, 0x00])) return 'ico'
  if (ascii(b, 0, 2) === 'BM' && b.length >= 18) return 'bmp'
  if (looksLikeSvg(b)) return 'svg'
  return null
}

/** HEIF-family files (HEIC, AVIF) declare "brands" in their first box. */
function sniffIsoBrand(b: Uint8Array): ImageFormat | null {
  const boxSize = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0
  const end = Math.min(boxSize || b.length, b.length)
  const brands = [ascii(b, 8, 12)]
  for (let i = 16; i + 4 <= end; i += 4) brands.push(ascii(b, i, i + 4))
  if (brands.some((x) => x === 'avif' || x === 'avis')) return 'avif'
  if (brands.some((x) => ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'].includes(x))) return 'heic'
  return null
}

function looksLikeSvg(b: Uint8Array): boolean {
  const text = new TextDecoder().decode(b.subarray(0, 2048)).trimStart() // TextDecoder drops a leading BOM
  if (!text.startsWith('<')) return false
  return /<svg[\s>]/i.test(text)
}

export function formatFromFileInfo(name: string, type: string): ImageFormat | null {
  const ext = name.toLowerCase().split('.').pop() ?? ''
  return MIME[type.toLowerCase()] ?? EXTENSIONS[ext] ?? null
}

/** "Holiday photo.final.JPG" → "Holiday photo.final" */
export function baseName(name: string): string {
  const clean = name.replace(/[\\/:*?"<>|]+/g, '_').trim()
  const dot = clean.lastIndexOf('.')
  const base = dot > 0 ? clean.slice(0, dot) : clean
  return base || 'image'
}
