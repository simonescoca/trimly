import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { COLORS, expectColor, expectEditorWith, openFixture } from './helpers'

test.use({ locale: 'en-US' })

type Decoded = { name: string; w: number; h: number; px: (x: number, y: number) => number[] }

/** Clicks Download and decodes the saved file in the browser (works for PNG, JPG and WebP). */
async function downloadAndDecode(page: Page, points: [number, number][], isMobile: boolean): Promise<Decoded> {
  const button = isMobile
    ? page.locator('header').getByRole('button', { name: 'Download' })
    : page.locator('aside').getByRole('button', { name: 'Download' })
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
  const bytes = readFileSync((await download.path())!)
  const name = download.suggestedFilename()
  const type = name.endsWith('.png') ? 'image/png' : name.endsWith('.jpg') ? 'image/jpeg' : 'image/webp'
  const result = await page.evaluate(
    async ({ b64, type, points }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      const bmp = await createImageBitmap(new Blob([bytes], { type }))
      const c = document.createElement('canvas')
      c.width = bmp.width
      c.height = bmp.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(bmp, 0, 0)
      const samples = points.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data))
      return { w: bmp.width, h: bmp.height, samples }
    },
    { b64: bytes.toString('base64'), type, points },
  )
  const map = new Map(points.map((p, i) => [p.join(), result.samples[i]]))
  return { name, w: result.w, h: result.h, px: (x, y) => map.get(`${x},${y}`)! }
}

async function showTool(page: Page, tab: 'Shape' | 'Style' | 'Rotate' | 'Export', isMobile: boolean) {
  if (isMobile) await page.getByRole('tab', { name: tab }).click()
}

const alpha = (rgba: number[]) => rgba[3]

test.describe('with the PNG pattern', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await openFixture(page, 'pattern.png')
    await expectEditorWith(page, '400x300 png')
  })

  test('downloads the whole image unchanged by default', async ({ page, isMobile }) => {
    const pts: [number, number][] = [[5, 5], [395, 5], [5, 295], [395, 295], [0, 0], [399, 299]]
    const out = await downloadAndDecode(page, pts, isMobile)
    expect(out.name).toBe('pattern-cropped.png')
    expect([out.w, out.h]).toEqual([400, 300])
    expectColor(out.px(5, 5), COLORS.red, 2)
    expectColor(out.px(395, 5), COLORS.green, 2)
    expectColor(out.px(5, 295), COLORS.blue, 2)
    expectColor(out.px(395, 295), COLORS.yellow, 2)
    // Edge pixels are fully opaque: no fringe from resampling.
    expect(alpha(out.px(0, 0))).toBe(255)
    expect(alpha(out.px(399, 299))).toBe(255)
  })

  test('circle: transparent outside, opaque inside', async ({ page, isMobile }) => {
    await page.getByRole('radio', { name: 'Circle' }).click()
    await showTool(page, 'Export', isMobile)
    await expect(page.getByTestId('export-summary')).toContainText('300 × 300 px · PNG')
    const out = await downloadAndDecode(page, [[2, 2], [297, 297], [150, 150], [75, 75], [225, 225]], isMobile)
    expect([out.w, out.h]).toEqual([300, 300])
    expect(alpha(out.px(2, 2))).toBe(0)
    expect(alpha(out.px(297, 297))).toBe(0)
    expect(alpha(out.px(150, 150))).toBe(255)
    expectColor(out.px(75, 75), COLORS.red, 2)
    expectColor(out.px(225, 225), COLORS.yellow, 2)
  })

  test('circle on a white background as JPG, with a border', async ({ page, isMobile }) => {
    await page.getByRole('radio', { name: 'Circle' }).click()
    await showTool(page, 'Style', isMobile)
    await page.getByRole('radio', { name: 'Colour' }).click()
    const border = page.getByRole('slider', { name: 'Border' })
    await border.focus()
    for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight') // 10 %
    await page.getByRole('radio', { name: 'Black' }).last().click()
    await showTool(page, 'Export', isMobile)
    await page.getByRole('radio', { name: 'JPG' }).click()
    const out = await downloadAndDecode(page, [[3, 3], [150, 8], [150, 150]], isMobile)
    expect(out.name).toBe('pattern-cropped.jpg')
    expectColor(out.px(3, 3), [255, 255, 255], 6) // background
    expectColor(out.px(150, 8), [0, 0, 0], 30) // border ring (30 px thick)
    expect(alpha(out.px(150, 150))).toBe(255)
  })

  test('rounded square has transparent corners', async ({ page, isMobile }) => {
    await page.getByRole('radio', { name: 'Rounded' }).click()
    const out = await downloadAndDecode(page, [[1, 1], [150, 150], [150, 1]], isMobile)
    expect([out.w, out.h]).toEqual([300, 300])
    expect(alpha(out.px(1, 1))).toBe(0)
    expect(alpha(out.px(150, 1))).toBe(255)
    expect(alpha(out.px(150, 150))).toBe(255)
  })

  test('rotation and flips end up in the file', async ({ page, isMobile }) => {
    await showTool(page, 'Rotate', isMobile)
    await page.getByRole('button', { name: 'Rotate right' }).click()
    await page.getByRole('button', { name: 'Flip horizontally' }).click()
    const out = await downloadAndDecode(page, [[10, 10], [290, 10], [10, 390], [290, 390]], isMobile)
    expect([out.w, out.h]).toEqual([300, 400])
    // Rotated right: blue, red / yellow, green — then mirrored left↔right.
    expectColor(out.px(10, 10), COLORS.red, 2)
    expectColor(out.px(290, 10), COLORS.blue, 2)
    expectColor(out.px(10, 390), COLORS.green, 2)
    expectColor(out.px(290, 390), COLORS.yellow, 2)
  })

  test('a straightened crop never has empty corners', async ({ page, isMobile }) => {
    await showTool(page, 'Rotate', isMobile)
    const slider = page.getByRole('slider', { name: 'Straighten' })
    await slider.focus()
    for (let i = 0; i < 120; i++) await page.keyboard.press('ArrowRight') // 12°
    const out = await downloadAndDecode(page, [[0, 0], [1, 1]], isMobile)
    expect(out.w).toBeLessThan(400)
    expect(alpha(out.px(0, 0))).toBeGreaterThan(200)
    expect(alpha(out.px(1, 1))).toBe(255)
  })

  test('exports at a custom size', async ({ page, isMobile }) => {
    await showTool(page, 'Export', isMobile)
    await page.getByRole('radio', { name: 'Custom' }).click()
    const width = page.getByRole('textbox', { name: 'Width' })
    await width.fill('100')
    await width.press('Enter')
    await expect(page.getByTestId('export-summary')).toContainText('100 × 75 px')
    const out = await downloadAndDecode(page, [[10, 10], [90, 65]], isMobile)
    expect([out.w, out.h]).toEqual([100, 75])
    expectColor(out.px(10, 10), COLORS.red, 10)
    expectColor(out.px(90, 65), COLORS.yellow, 10)
    // Quick sizes set the long side.
    await page.getByRole('button', { name: '1080' }).click()
    await expect(page.getByTestId('export-summary')).toContainText('1080 × 810 px')
    await expect(page.getByText(/Larger than the original/)).toBeVisible()
  })

  test('the preview shows the result', async ({ page, isMobile }) => {
    await page.getByRole('radio', { name: 'Circle' }).click()
    await showTool(page, 'Export', isMobile)
    // The preview redraws on the next animation frame: wait for it.
    const alphaAt = (fx: number, fy: number) =>
      page
        .getByTestId('preview-canvas')
        .evaluate((c: HTMLCanvasElement, [fx, fy]) => c.getContext('2d')!.getImageData(Math.floor(c.width * fx), Math.floor(c.height * fy), 1, 1).data[3], [fx, fy])
    await expect.poll(() => alphaAt(0.01, 0.01)).toBe(0)
    await expect.poll(() => alphaAt(0.5, 0.5)).toBe(255)
    // Fully visible inside its box (not cut off), with its proportions kept.
    const canvas = (await page.getByTestId('preview-canvas').boundingBox())!
    const frame = (await page.getByTestId('preview-canvas').locator('..').boundingBox())!
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(frame.y + frame.height + 0.5)
    expect(canvas.x + canvas.width).toBeLessThanOrEqual(frame.x + frame.width + 0.5)
    expect(canvas.width / canvas.height).toBeCloseTo(1, 1)
    await expect(page.getByTestId('export-summary')).toContainText(/≈ [\d.]+ (B|KB)/)
  })
})

test('photos are saved as JPG by default', async ({ page, isMobile }) => {
  await page.goto('/')
  await openFixture(page, 'pattern.jpg')
  await expectEditorWith(page, '400x300 jpeg')
  const out = await downloadAndDecode(page, [[5, 5]], isMobile)
  expect(out.name).toBe('pattern-cropped.jpg')
  expectColor(out.px(5, 5), COLORS.red, 12)
})

test('copies the image to the clipboard', async ({ page, context, browserName, isMobile }) => {
  test.skip(browserName !== 'chromium' || isMobile, 'clipboard permissions can only be granted in desktop Chromium')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await openFixture(page, 'pattern.png')
  await page.getByRole('button', { name: 'Copy image' }).click()
  await expect(page.getByText('Image copied')).toBeVisible()
  const types = await page.evaluate(async () => (await navigator.clipboard.read())[0].types)
  expect(types).toContain('image/png')
})
