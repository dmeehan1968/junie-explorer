/** @jsxImportSource @kitajs/html */

import { test, expect } from './versionBanner.dsl.js'

// Helper to assert class tokens contain key expected tokens (order-insensitive)
async function expectClassesToContain(dsl: any, expectedTokens: string[]) {
  const cls = await dsl.classAttr()
  const tokens = new Set((cls ?? '').trim().split(/\s+/))
  for (const t of expectedTokens) expect(tokens.has(t)).toBeTruthy()
}

const OUTER_CLASSES = ['alert','alert-warning','shadow-sm','my-4']
const INNER_CLASSES = ['flex','flex-wrap','items-center','gap-3','w-full']

// Tests grouped by feature/prop per guidelines

test.describe('VersionBanner', () => {
  test('renders nothing when version is undefined', async ({ versionBanner, page }) => {
    await versionBanner.setVersion(undefined)
    // There should be no element with data-testid="version-banner"
    await expect(page.getByTestId('version-banner')).toHaveCount(0)
  })

  test('renders banner with message and link when version provided', async ({ versionBanner }) => {
    await expect(versionBanner.banner).toBeVisible()
    await expect(versionBanner.messageText).toContainText('New version available: 1.1.0 (you have 1.0.0)')

    await expect(versionBanner.link).toBeVisible()
    await expect(versionBanner.link).toHaveAttribute('href', 'https://example.com/release')
    await expect(versionBanner.link).toHaveAttribute('target', '_blank')
    await expect(versionBanner.link).toHaveAttribute('data-testid', 'version-link')

    await expectClassesToContain(versionBanner, OUTER_CLASSES)
    await expect(versionBanner.banner.locator('div')).toHaveClass(new RegExp(INNER_CLASSES.join('.*'))) // rough check
  })

  test('updates when version prop changes', async ({ versionBanner }) => {
    await expect(versionBanner.messageText).toContainText('(you have 1.0.0)')

    await versionBanner.setVersion({
      currentVersion: '2.0.0',
      newVersion: '3.0.0',
      releaseUrl: 'https://example.com/v3'
    })

    await expect(versionBanner.messageText).toContainText('New version available: 3.0.0 (you have 2.0.0)')
    await expect(versionBanner.link).toHaveAttribute('href', 'https://example.com/v3')
  })
})
