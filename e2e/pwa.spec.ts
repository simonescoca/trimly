import { expect, test } from '@playwright/test'
import { expectEditorWith, openFixture } from './helpers'

test.use({ locale: 'en-US' })

test('has a valid web app manifest with icons', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = await (await request.get(href!)).json()
  expect(manifest.name).toBe('Trimly')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)
  for (const icon of manifest.icons) {
    const res = await request.get(`/${icon.src}`)
    expect(res.status(), icon.src).toBe(200)
  }
  expect((await request.get('/apple-touch-icon-180x180.png')).status()).toBe(200)
})

test('works offline after the first visit, HEIC included', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'offline emulation with service workers is only reliable in Chromium')
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 }).toBe(true)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Choose an image' })).toBeVisible()
  // The HEIC decoder is not in the page yet: it must come from the offline cache.
  await openFixture(page, 'pattern.heic')
  await expectEditorWith(page, '400x300 heic')
  await context.setOffline(false)
})

test('shares nicely: social preview tags and image', async ({ page, request }) => {
  await page.goto('/')
  const og = (p: string) => page.locator(`meta[property="og:${p}"]`).getAttribute('content')
  expect(await og('title')).toContain('Trimly')
  const image = (await og('image'))!
  expect(image).toMatch(/og-image\.jpg$/)
  const res = await request.get(image.startsWith('http') ? new URL(image).pathname : image)
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('image/jpeg')
  expect((await res.body()).length).toBeLessThan(300_000) // WhatsApp skips bigger previews
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
})

test('links to the open-source licences', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.getByRole('link', { name: 'Open-source licences' }).getAttribute('href')
  const text = await (await request.get(href!)).text()
  expect(text).toContain('heic-to')
  expect(text).toContain('GNU LESSER GENERAL PUBLIC LICENSE')
  expect(text).toContain('react')
})
