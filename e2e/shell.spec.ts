import { expect, test } from '@playwright/test'

test.describe('language', () => {
  test.use({ locale: 'it-IT' })

  test('is detected from the browser and can be switched', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ritaglia qualsiasi immagine, in un attimo.')
    await expect(page).toHaveTitle(/ritaglia/i)
    await expect(page.locator('html')).toHaveAttribute('lang', 'it')

    await page.getByRole('radio', { name: 'EN' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Crop any image, in a moment.')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    // The choice survives a reload.
    await page.reload()
    await expect(page.getByRole('button', { name: 'Choose an image' })).toBeVisible()
  })
})

test.describe('theme', () => {
  test.use({ colorScheme: 'light', locale: 'en-US' })

  test('follows the OS and can be toggled without a flash on reload', async ({ page }) => {
    await page.goto('/')
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(await bg()).toBe('rgb(246, 246, 248)')

    await page.getByRole('button', { name: 'Switch to dark theme' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await bg()).toBe('rgb(13, 13, 16)')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // Toggling back to the OS theme returns to "follow the system".
    await page.getByRole('button', { name: 'Switch to light theme' }).click()
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/)
    expect(await bg()).toBe('rgb(246, 246, 248)')
  })
})

test('the empty state offers the main actions', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /choose an image|scegli/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /sample|esempio/i })).toBeVisible()
  await expect(page.getByText(/never leave your device|non lasciano mai/i)).toBeVisible()
})

test.describe('narrow phones', () => {
  test.use({ viewport: { width: 320, height: 640 }, locale: 'it-IT' })

  test('nothing overflows horizontally, before and after opening an image', async ({ page }) => {
    await page.goto('/')
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(await overflow()).toBeLessThanOrEqual(0)
    await page.getByRole('button', { name: /esempio/ }).click()
    await expect(page.getByTestId('crop-box')).toBeVisible()
    expect(await overflow()).toBeLessThanOrEqual(0)
    // "New image" is still reachable, as a compact button.
    await expect(page.getByRole('button', { name: 'Nuova immagine' })).toBeVisible()
    await expect(page.locator('header').getByRole('button', { name: 'Scarica' })).toBeVisible()
  })
})

test.describe('phone held sideways', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, locale: 'en-US' })

  test('uses the side panel so the picture keeps enough room', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /sample/ }).click()
    await expect(page.getByTestId('crop-box')).toBeVisible()
    await expect(page.getByRole('tablist')).toHaveCount(0)
    await expect(page.locator('aside').getByRole('button', { name: 'Download' })).toBeVisible()
    const stage = (await page.getByTestId('stage-canvas').boundingBox())!
    expect(stage.height).toBeGreaterThan(300)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  })
})
