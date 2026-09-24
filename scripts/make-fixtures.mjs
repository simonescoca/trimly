// Generates the test images used by the end-to-end tests (e2e/fixtures).
// Requires macOS `sips` (built in) and `cwebp` (Homebrew `webp`).
//
// The main pattern is 400×300 with four coloured quadrants, so tests can
// check crop position, rotation and flips by sampling pixel colours:
//   top-left red · top-right green · bottom-left blue · bottom-right yellow
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { PNG } from 'pngjs'

const OUT = join(import.meta.dirname, '..', 'e2e', 'fixtures')
const TMP = join(OUT, '.tmp')
mkdirSync(TMP, { recursive: true })

export const QUADRANTS = {
  tl: [255, 0, 0],
  tr: [0, 200, 0],
  bl: [0, 0, 255],
  br: [255, 215, 0],
}

function quadrantColor(x, y, w, h) {
  const left = x < w / 2
  const top = y < h / 2
  if (top) return left ? QUADRANTS.tl : QUADRANTS.tr
  return left ? QUADRANTS.bl : QUADRANTS.br
}

function writePng(path, w, h, pixel) {
  const png = new PNG({ width: w, height: h })
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a = 255] = pixel(x, y)
      const i = (y * w + x) * 4
      png.data[i] = r
      png.data[i + 1] = g
      png.data[i + 2] = b
      png.data[i + 3] = a
    }
  }
  writeFileSync(path, PNG.sync.write(png))
}

const sips = (fmt, src, dst, extra = []) =>
  execFileSync('sips', ['-s', 'format', fmt, ...extra, src, '--out', dst], { stdio: 'ignore' })

// 1. Base pattern in every format.
const W = 400
const H = 300
const pattern = join(OUT, 'pattern.png')
writePng(pattern, W, H, (x, y) => quadrantColor(x, y, W, H))

sips('jpeg', pattern, join(OUT, 'pattern.jpg'), ['-s', 'formatOptions', '95'])
sips('heic', pattern, join(OUT, 'pattern.heic'))
sips('tiff', pattern, join(OUT, 'pattern.tiff'))
sips('bmp', pattern, join(OUT, 'pattern.bmp'))
sips('gif', pattern, join(OUT, 'pattern.gif'))
sips('avif', pattern, join(OUT, 'pattern.avif'))
execFileSync('cwebp', ['-quiet', '-q', '95', pattern, '-o', join(OUT, 'pattern.webp')])

// ICO must be small: 64×64 version of the pattern.
const small = join(TMP, 'small.png')
writePng(small, 64, 64, (x, y) => quadrantColor(x, y, 64, 64))
sips('ico', small, join(OUT, 'pattern.ico'))

// 2. PNG with transparency: left half transparent, right half magenta.
writePng(join(OUT, 'alpha.png'), 200, 200, (x) => (x < 100 ? [0, 0, 0, 0] : [255, 0, 255, 255]))

// 3. JPEG with EXIF Orientation = 6 ("rotate 90° clockwise to display").
//    Stored pixels are the pattern rotated 90° counter-clockwise (300×400),
//    so a correct decoder displays the normal 400×300 pattern.
const storedPng = join(TMP, 'stored.png')
writePng(storedPng, H, W, (sx, sy) => quadrantColor(W - 1 - sy, sx, W, H))
const storedJpg = join(TMP, 'stored.jpg')
sips('jpeg', storedPng, storedJpg, ['-s', 'formatOptions', '95'])
writeFileSync(join(OUT, 'exif-rotated.jpg'), withExifOrientation(readFileSync(storedJpg), 6))

// 4. SVGs: one with explicit size, one with only a viewBox.
const svgBody = `
  <rect x="0" y="0" width="200" height="150" fill="rgb(255,0,0)"/>
  <rect x="200" y="0" width="200" height="150" fill="rgb(0,200,0)"/>
  <rect x="0" y="150" width="200" height="150" fill="rgb(0,0,255)"/>
  <rect x="200" y="150" width="200" height="150" fill="rgb(255,215,0)"/>`
writeFileSync(
  join(OUT, 'pattern.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">${svgBody}</svg>`,
)
writeFileSync(
  join(OUT, 'viewbox-only.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${svgBody}</svg>`,
)

// 5. Large photo (18.75 MP): above the iPhone canvas limit (16.7 MP), below the desktop one.
sips('jpeg', pattern, join(OUT, 'large.jpg'), ['-z', '3750', '5000', '-s', 'formatOptions', '80'])

// 6. Broken inputs.
writeFileSync(join(OUT, 'corrupt.jpg'), Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 7)]))
writeFileSync(join(OUT, 'not-an-image.txt'), 'hello, I am not an image\n')

rmSync(TMP, { recursive: true, force: true })
console.log('Fixtures written to', OUT)

/** Replaces any APP1 (EXIF) segment with a minimal one carrying `orientation`. */
function withExifOrientation(jpeg, orientation) {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error('not a JPEG')
  const tiff = Buffer.from([
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // big-endian TIFF header, IFD0 at 8
    0x00, 0x01, // 1 entry
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, // tag 0x0112 Orientation, SHORT, count 1
    0x00, orientation, 0x00, 0x00, // value + padding
    0x00, 0x00, 0x00, 0x00, // no next IFD
  ])
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff])
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, (payload.length + 2) >> 8, (payload.length + 2) & 0xff]), payload])

  // Walk the header segments, dropping existing APP1s; insert ours after APP0 (JFIF).
  const parts = [jpeg.subarray(0, 2)]
  let pos = 2
  let inserted = false
  while (pos < jpeg.length && jpeg[pos] === 0xff) {
    const marker = jpeg[pos + 1]
    if (marker === 0xda) break // start of scan: the rest is image data
    const len = jpeg.readUInt16BE(pos + 2)
    const segment = jpeg.subarray(pos, pos + 2 + len)
    if (marker !== 0xe1) {
      parts.push(segment)
      if (marker === 0xe0 && !inserted) {
        parts.push(app1)
        inserted = true
      }
    }
    pos += 2 + len
  }
  if (!inserted) parts.splice(1, 0, app1)
  parts.push(jpeg.subarray(pos))
  return Buffer.concat(parts)
}
