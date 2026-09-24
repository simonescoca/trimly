import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectEditorWith, openFixture } from './helpers'

test.use({ locale: 'en-US' })

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 4).join(' | ')}`)
  expect(summary, summary.join('\n')).toEqual([])
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme })

    test('start screen has no accessibility violations', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium')
      await page.goto('/')
      await audit(page)
    })

    test('editor has no accessibility violations', async ({ page, browserName, isMobile }) => {
      test.skip(browserName !== 'chromium')
      await page.goto('/')
      await openFixture(page, 'pattern.png')
      await expectEditorWith(page, '400x300 png')
      await page.getByRole('radio', { name: 'Circle' }).click()
      if (isMobile) await page.getByRole('tab', { name: 'Style' }).click()
      await page.getByRole('radio', { name: 'Colour' }).click()
      await audit(page)
      // With export warnings visible (enlargement).
      if (isMobile) await page.getByRole('tab', { name: 'Export' }).click()
      await page.getByRole('radio', { name: 'Custom' }).click()
      await page.getByRole('button', { name: '2048' }).click()
      await expect(page.getByText(/Larger than the original/)).toBeVisible()
      await audit(page)
      if (isMobile) {
        for (const tab of ['Rotate', 'Export']) {
          await page.getByRole('tab', { name: tab }).click()
          await audit(page)
        }
      }
    })
  })
}
