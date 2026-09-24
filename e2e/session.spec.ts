import { expect, test } from '@playwright/test'
import { expectEditorWith, openFixture } from './helpers'

test.use({ locale: 'en-US' })

test('a whole session produces no errors', async ({ page, isMobile }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Try a sample image' }).click()
  await expectEditorWith(page, '2400x1600 svg')
  await page.getByRole('radio', { name: 'Circle' }).click()
  if (isMobile) await page.getByRole('tab', { name: 'Rotate' }).click()
  await page.getByRole('button', { name: 'Rotate left' }).click()
  await page.getByRole('slider', { name: 'Straighten' }).focus()
  await page.keyboard.press('ArrowLeft')

  // Replace the image mid-edit, go home, come back.
  await openFixture(page, 'pattern.heic')
  await expectEditorWith(page, '400x300 heic')
  await page.getByRole('button', { name: 'Trimly, start over' }).click()
  await expect(page.getByRole('button', { name: 'Choose an image' })).toBeVisible()
  await page.getByRole('button', { name: 'Try a sample image' }).click()
  await expectEditorWith(page, '2400x1600 svg')

  const button = isMobile ? page.locator('header').getByRole('button', { name: 'Download' }) : page.locator('aside').getByRole('button', { name: 'Download' })
  await Promise.all([page.waitForEvent('download'), button.click()])
  await page.waitForTimeout(600) // let the background size estimate finish too
  expect(errors).toEqual([])
})
