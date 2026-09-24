import { expect, test } from '@playwright/test'
import { dropFiles, expectEditorWith, expectPatternOnStage, openFixture, pasteFile, payload } from './helpers'

test.use({ locale: 'en-US' })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

const formats: [file: string, info: string][] = [
  ['pattern.jpg', '400x300 jpeg'],
  ['pattern.png', '400x300 png'],
  ['pattern.gif', '400x300 gif'],
  ['pattern.webp', '400x300 webp'],
  ['pattern.bmp', '400x300 bmp'],
  ['pattern.avif', '400x300 avif'],
  ['pattern.tiff', '400x300 tiff'],
  ['pattern.heic', '400x300 heic'],
  ['pattern.svg', '2048x1536 svg'],
  ['viewbox-only.svg', '2048x1536 svg'],
  ['exif-rotated.jpg', '400x300 jpeg'],
]

for (const [file, info] of formats) {
  test(`opens ${file} with the right size, orientation and colours`, async ({ page }) => {
    await openFixture(page, file)
    await expectEditorWith(page, info)
    await expectPatternOnStage(page)
  })
}

test('opens ICO files', async ({ page }) => {
  await openFixture(page, 'pattern.ico')
  await expectEditorWith(page, /^64x64 ico/)
})

test('detects transparency in PNGs', async ({ page }) => {
  await openFixture(page, 'alpha.png')
  await expectEditorWith(page, '200x200 png alpha')
})

test('rejects a file that is not an image', async ({ page }) => {
  await openFixture(page, 'not-an-image.txt')
  await expect(page.getByText('This file isn’t an image.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Choose an image' })).toBeVisible()
})

test('explains when an image is damaged', async ({ page }) => {
  await openFixture(page, 'corrupt.jpg')
  await expect(page.getByText(/couldn’t be opened/)).toBeVisible()
})

test('explains when a file is empty', async ({ page }) => {
  await page.getByTestId('file-input').setInputFiles({ name: 'empty.png', mimeType: 'image/png', buffer: Buffer.alloc(0) })
  await expect(page.getByText('This file is empty.')).toBeVisible()
})

test('opens a dropped image and shows the drop overlay while dragging', async ({ page }) => {
  await dropFiles(page, [payload('pattern.png', 'image/png')], { release: false })
  await expect(page.getByText('Drop to open')).toBeVisible()
  await dropFiles(page, [payload('pattern.png', 'image/png')])
  await expect(page.getByText('Drop to open')).toBeHidden()
  await expectEditorWith(page, '400x300 png')
})

test('opens only the first image when several are dropped', async ({ page }) => {
  await dropFiles(page, [payload('not-an-image.txt', 'text/plain'), payload('pattern.jpg', 'image/jpeg'), payload('pattern.png', 'image/png')])
  await expectEditorWith(page, '400x300 jpeg')
  await expect(page.getByText('Only the first image was opened.')).toBeVisible()
})

test('opens a pasted image', async ({ page, browserName }) => {
  // Firefox empties the clipboard of script-made paste events, so a real ⌘V can't be simulated there.
  test.skip(browserName === 'firefox', 'synthetic paste events carry no files in Firefox')
  await pasteFile(page, payload('pattern.webp', 'image/webp'))
  await expectEditorWith(page, '400x300 webp')
})

test('opens the sample image', async ({ page }) => {
  await page.getByRole('button', { name: 'Try a sample image' }).click()
  await expectEditorWith(page, '2400x1600 svg')
})

test('can replace the image and go back to the start', async ({ page }) => {
  await openFixture(page, 'pattern.jpg')
  await expectEditorWith(page, '400x300 jpeg')
  await openFixture(page, 'alpha.png')
  await expectEditorWith(page, '200x200 png alpha')
  await page.getByRole('button', { name: 'Trimly, start over' }).click()
  await expect(page.getByRole('button', { name: 'Choose an image' })).toBeVisible()
})

test('shrinks images beyond what the device can handle', async ({ page, isMobile, browserName }) => {
  await openFixture(page, 'large.jpg')
  const iPhone = isMobile && browserName === 'webkit'
  if (iPhone) {
    // iOS caps canvases at 16.7 MP: 5000×3750 must be reduced, keeping the aspect ratio.
    await expect(page.getByText(/very large/)).toBeVisible()
    const info = await page.getByTestId('stage-canvas').getAttribute('data-image')
    const [w, h] = info!.split(' ')[0].split('x').map(Number)
    expect(w * h).toBeLessThanOrEqual(16_777_216)
    expect(w / h).toBeCloseTo(4 / 3, 2)
  } else {
    await expectEditorWith(page, '5000x3750 jpeg')
  }
  await expectPatternOnStage(page)
})
