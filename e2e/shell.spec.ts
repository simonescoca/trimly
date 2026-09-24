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
