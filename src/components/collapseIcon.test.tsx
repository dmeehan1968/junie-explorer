/** @jsxImportSource @kitajs/html */

import { test, expect } from './collapseIcon.dsl.js'

test.describe('CollapseIcon (component)', () => {
  test('renders expected SVG structure and attributes', async ({ page, collapseIcon }) => {

    await expect(collapseIcon.svg).toBeVisible()
    await expect(collapseIcon.height).resolves.toEqual(24)
    await expect(collapseIcon.width).resolves.toEqual(24)
    await expect(collapseIcon.viewBox).resolves.toEqual('0 0 24 24')

    const count = await collapseIcon.paths.count()
    await expect(collapseIcon.paths).toHaveCount(4)

    for (let i = 0; i < count; i++) {
      await expect(collapseIcon.paths.nth(i)).toHaveAttribute('stroke', 'currentColor')
      await expect(collapseIcon.paths.nth(i)).toHaveAttribute('stroke-width', '1.5')
      await expect(collapseIcon.paths.nth(i)).toHaveAttribute('stroke-linecap', 'round')
      await expect(collapseIcon.paths.nth(i)).toHaveAttribute('stroke-linejoin', 'round')
    }
  })
})
