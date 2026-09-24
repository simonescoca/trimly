import { expect, test, type Page } from '@playwright/test'
import { COLORS, expectColor, expectEditorWith, openFixture, stagePixel } from './helpers'

test.use({ locale: 'en-US' })

type R = { x: number; y: number; w: number; h: number }
const cropRect = async (page: Page): Promise<R> => {
  const [x, y, w, h] = (await page.getByTestId('crop-box').getAttribute('data-rect'))!.split(',').map(Number)
  return { x, y, w, h }
}
const center = async (page: Page, selector: string) => {
  const b = (await page.locator(selector).boundingBox())!
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}
async function drag(page: Page, from: { x: number; y: number }, dx: number, dy: number) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + dx / 2, from.y + dy / 2, { steps: 4 })
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 4 })
  await page.mouse.up()
}
/** On phones the tools live behind tabs. */
async function showTool(page: Page, tab: 'Shape' | 'Style' | 'Rotate' | 'Export', isMobile: boolean) {
  if (isMobile) await page.getByRole('tab', { name: tab }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await openFixture(page, 'pattern.png')
  await expectEditorWith(page, '400x300 png')
})

test('starts with the whole image selected', async ({ page }) => {
  expect(await cropRect(page)).toEqual({ x: -200, y: -150, w: 400, h: 300 })
})

test('resizes from a corner and from an edge', async ({ page }) => {
  await drag(page, await center(page, '[data-handle="se"]'), -60, -40)
  const r = await cropRect(page)
  expect(r.x).toBe(-200)
  expect(r.y).toBe(-150)
  expect(r.w).toBeLessThan(400)
  expect(r.h).toBeLessThan(300)

  await drag(page, await center(page, '[data-handle="w"]'), 40, 0)
  const r2 = await cropRect(page)
  expect(r2.x).toBeGreaterThan(-200)
  expect(r2.y).toBe(r.y)
  expect(r2.h).toBe(r.h)
})

test('moves the crop but never outside the image', async ({ page }) => {
  await drag(page, await center(page, '[data-handle="se"]'), -80, -60)
  const before = await cropRect(page)
  await drag(page, await center(page, '[data-testid="crop-box"]'), 2000, 2000)
  const after = await cropRect(page)
  expect(after.w).toBe(before.w)
  expect(after.x + after.w).toBeCloseTo(200, 1)
  expect(after.y + after.h).toBeCloseTo(150, 1)
})

test('moves the crop with the arrow keys', async ({ page }) => {
  await drag(page, await center(page, '[data-handle="se"]'), -80, -60)
  const before = await cropRect(page)
  await page.getByTestId('crop-box').focus()
  await page.keyboard.press('Shift+ArrowRight')
  await page.keyboard.press('ArrowDown')
  const after = await cropRect(page)
  expect(after.x).toBeGreaterThan(before.x)
  expect(after.y).toBeGreaterThan(before.y)
})

test('resizes the crop with Alt + arrow keys', async ({ page }) => {
  await page.getByTestId('crop-box').focus()
  await page.keyboard.press('Alt+Shift+ArrowLeft')
  await page.keyboard.press('Alt+Shift+ArrowUp')
  const r = await cropRect(page)
  expect(r.x).toBe(-200)
  expect(r.w).toBeLessThan(400)
  expect(r.h).toBeLessThan(300)
})

test('circle: square, round, as big as possible', async ({ page }) => {
  await page.getByRole('radio', { name: 'Circle' }).click()
  const r = await cropRect(page)
  expect(r.w).toBeCloseTo(300, 1)
  expect(r.h).toBeCloseTo(300, 1)
  await expect(page.getByTestId('crop-box')).toHaveCSS('border-radius', '50%')
  // Circles have no ratio choice; background & border options appear instead.
  await expect(page.getByRole('group', { name: 'Aspect ratio' })).toHaveCount(0)
})

test('rounded square has a roundness slider', async ({ page }) => {
  await page.getByRole('radio', { name: 'Rounded' }).click()
  const r = await cropRect(page)
  expect(r.w).toBeCloseTo(r.h, 1)
  await expect(page.getByRole('slider', { name: 'Roundness' })).toBeVisible()
})

test('ratio presets, swap and custom ratio', async ({ page }) => {
  await page.getByRole('button', { name: '16:9' }).click()
  let r = await cropRect(page)
  expect(r.w / r.h).toBeCloseTo(16 / 9, 2)
  expect(r.w).toBeCloseTo(400, 0)

  await page.getByRole('button', { name: 'Swap portrait / landscape' }).click()
  r = await cropRect(page)
  expect(r.w / r.h).toBeCloseTo(9 / 16, 2)
  await expect(page.getByRole('button', { name: '9:16' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Custom' }).click()
  await page.getByRole('textbox', { name: 'Ratio width' }).fill('3,5')
  await page.getByRole('textbox', { name: 'Ratio height' }).fill('4,5')
  await page.getByRole('textbox', { name: 'Ratio height' }).press('Enter')
  r = await cropRect(page)
  expect(r.w / r.h).toBeCloseTo(3.5 / 4.5, 2)
})

test('rotating turns the picture clockwise', async ({ page, isMobile }) => {
  await showTool(page, 'Rotate', isMobile)
  await page.getByRole('button', { name: 'Rotate right' }).click()
  const r = await cropRect(page)
  expect(r.w).toBeCloseTo(300, 1)
  expect(r.h).toBeCloseTo(400, 1)
  // Old bottom-left (blue) is now top-left, old top-left (red) top-right.
  expectColor(await stagePixel(page, -30, -30), COLORS.blue)
  expectColor(await stagePixel(page, 30, -30), COLORS.red)
  expectColor(await stagePixel(page, 30, 30), COLORS.green)
})

test('flipping mirrors the picture', async ({ page, isMobile }) => {
  await showTool(page, 'Rotate', isMobile)
  await page.getByRole('button', { name: 'Flip horizontally' }).click()
  expectColor(await stagePixel(page, -30, -30), COLORS.green)
  expectColor(await stagePixel(page, 30, -30), COLORS.red)
  await page.getByRole('button', { name: 'Flip vertically' }).click()
  expectColor(await stagePixel(page, -30, -30), COLORS.yellow)
})

test('straightening keeps the crop inside the tilted picture', async ({ page, isMobile }) => {
  await showTool(page, 'Rotate', isMobile)
  const slider = page.getByRole('slider', { name: 'Straighten' })
  await slider.focus()
  for (let i = 0; i < 50; i++) await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveValue('5')
  const r = await cropRect(page)
  expect(r.w).toBeLessThan(400)
  expect(r.w / r.h).toBeCloseTo(4 / 3, 2)
  // Back to zero restores the full crop.
  await slider.press('Escape')
  await expect(slider).toHaveValue('0')
  expect(await cropRect(page)).toEqual({ x: -200, y: -150, w: 400, h: 300 })
})

test('undo and redo, with buttons and keyboard', async ({ page }) => {
  await page.getByRole('radio', { name: 'Circle' }).click()
  await expect(page.getByTestId('crop-box')).toHaveCSS('border-radius', '50%')
  await page.keyboard.press('ControlOrMeta+z')
  expect((await cropRect(page)).w).toBe(400)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  expect((await cropRect(page)).w).toBeCloseTo(300, 1)
  await page.getByRole('button', { name: 'Undo' }).click()
  expect((await cropRect(page)).w).toBe(400)
  await page.getByRole('button', { name: 'Redo' }).click()
  await page.getByRole('button', { name: 'Reset all changes' }).click()
  expect((await cropRect(page)).w).toBe(400)
})

test('zooms with the wheel and the toolbar', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no mouse wheel on phones')
  const stage = page.locator('[data-zoom]')
  const c = await center(page, '[data-testid="stage-canvas"]')
  await page.mouse.move(c.x, c.y)
  await page.mouse.wheel(0, -400)
  await expect.poll(async () => Number(await stage.getAttribute('data-zoom'))).toBeGreaterThan(1.5)
  await page.getByRole('button', { name: 'Fit to screen' }).click()
  await expect(stage).toHaveAttribute('data-zoom', '1.000')
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(stage).toHaveAttribute('data-zoom', '1.250')
})

test('pinch with two fingers zooms', async ({ page }) => {
  const stage = page.locator('[data-zoom]')
  const c = await center(page, '[data-testid="stage-canvas"]')
  await stage.evaluate((el, c) => {
    const fire = (type: string, id: number, x: number, y: number) =>
      el.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: id === 1 }))
    fire('pointerdown', 1, c.x - 40, c.y)
    fire('pointerdown', 2, c.x + 40, c.y)
    for (let i = 1; i <= 5; i++) {
      fire('pointermove', 1, c.x - 40 - i * 16, c.y)
      fire('pointermove', 2, c.x + 40 + i * 16, c.y)
    }
    fire('pointerup', 1, c.x - 120, c.y)
    fire('pointerup', 2, c.x + 120, c.y)
  }, c)
  await expect.poll(async () => Number(await stage.getAttribute('data-zoom'))).toBeGreaterThan(2.5)
})

test('phones show the tools in tabs', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'desktop shows every panel at once')
  await expect(page.getByRole('tab', { name: 'Shape' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('button', { name: 'Rotate right' })).toHaveCount(0)
  await page.getByRole('tab', { name: 'Rotate' }).click()
  await expect(page.getByRole('button', { name: 'Rotate right' })).toBeVisible()
  // The Style tab appears only for shapes that have an outside.
  await expect(page.getByRole('tab', { name: 'Style' })).toHaveCount(0)
  await page.getByRole('tab', { name: 'Shape' }).click()
  await page.getByRole('radio', { name: 'Circle' }).click()
  await expect(page.getByRole('tab', { name: 'Style' })).toBeVisible()
})
