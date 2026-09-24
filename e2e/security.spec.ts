import { expect, test } from '@playwright/test'
import { expectEditorWith, openFixture } from './helpers'

test.use({ locale: 'en-US' })

test('the strict Content Security Policy does not break anything', async ({ page, isMobile }) => {
  // Record every CSP violation the page reports.
  await page.addInitScript(() => {
    ;(window as unknown as { __csp: string[] }).__csp = []
    document.addEventListener('securitypolicyviolation', (e) => {
      ;(window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`)
    })
  })
  const response = await page.goto('/')
  expect(response?.headers()['content-security-policy']).toContain("default-src 'self'")

  await page.getByRole('button', { name: 'Try a sample image' }).click()
  await expectEditorWith(page, '2400x1600 svg')
  await page.getByRole('radio', { name: 'Circle' }).click()
  await openFixture(page, 'pattern.heic') // WebAssembly decoder
  await expectEditorWith(page, '400x300 heic')
  await openFixture(page, 'pattern.tiff')
  await expectEditorWith(page, '400x300 tiff')

  const button = isMobile ? page.locator('header').getByRole('button', { name: 'Download' }) : page.locator('aside').getByRole('button', { name: 'Download' })
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
  expect(download.suggestedFilename()).toMatch(/pattern-cropped\.(png|jpg)/)

  const violations = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)
  expect(violations).toEqual([])
})
