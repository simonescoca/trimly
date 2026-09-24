import { expect, test } from '@playwright/test'
import { openFixture } from './helpers'

// Rough performance budgets with an 18.75 MP photo (5000×3750). Generous on purpose: they catch
// regressions (e.g. redrawing the whole image on every mouse move), not machine-speed noise.
test.use({ locale: 'en-US' })
test.describe.configure({ mode: 'serial' })

test('opens, edits and exports a large photo quickly', async ({ page, browserName, isMobile }, info) => {
  test.skip(isMobile || browserName === 'firefox', 'measured on desktop Chromium and WebKit')
  await page.goto('/')

  let t = Date.now()
  await openFixture(page, 'large.jpg')
  await expect(page.getByTestId('crop-box')).toBeVisible()
  const openMs = Date.now() - t

  // Shrink, then drag the crop around: only the DOM box should move, not the whole picture.
  const handle = (await page.locator('[data-handle="se"]').boundingBox())!
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(handle.x - 200, handle.y - 150, { steps: 5 })
  await page.mouse.up()
  const box = (await page.getByTestId('crop-box').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  const moves = 60
  t = Date.now()
  for (let i = 0; i < moves; i++) await page.mouse.move(cx + Math.sin(i / 6) * 120, cy + Math.cos(i / 6) * 80)
  const dragMsPerMove = (Date.now() - t) / moves
  await page.mouse.up()

  // Straighten: this one does redraw the picture on every step.
  const slider = page.getByRole('slider', { name: 'Straighten' })
  await slider.focus()
  t = Date.now()
  for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowRight')
  const straightenMsPerStep = (Date.now() - t) / 30

  // Export the full-resolution crop as JPG.
  t = Date.now()
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('aside').getByRole('button', { name: 'Download' }).click()])
  await download.path()
  const exportMs = Date.now() - t

  const report = { openMs, dragMsPerMove: +dragMsPerMove.toFixed(1), straightenMsPerStep: +straightenMsPerStep.toFixed(1), exportMs }
  console.log(`[perf ${browserName}]`, JSON.stringify(report))
  await info.attach('perf', { body: JSON.stringify(report, null, 2), contentType: 'application/json' })

  expect(openMs).toBeLessThan(3000)
  expect(dragMsPerMove).toBeLessThan(40)
  expect(straightenMsPerStep).toBeLessThan(80)
  expect(exportMs).toBeLessThan(5000)
})
