/** @jsxImportSource @kitajs/html */

import { test, expect } from './collapseIcon.dsl.js'

test.describe('CollapseIcon (component)', () => {
  test('renders expected SVG structure and attributes', async ({ page, collapseIcon }) => {

    await expect(collapseIcon.svg).toBeVisible()
    await expect(collapseIcon.height).resolves.toEqual(24)
    await expect(collapseIcon.width).resolves.toEqual(24)
    await expect(collapseIcon.viewBox).resolves.toEqual('0 0 24 24')
    await expect(collapseIcon.stroke).resolves.toEqual('currentColor')
    await expect(collapseIcon.strokeWidth).resolves.toEqual(1.5)
    await expect(collapseIcon.strokeLineCap).resolves.toEqual('round')
    await expect(collapseIcon.strokeLineJoin).resolves.toEqual('round')

    await expect(collapseIcon.paths).toHaveCount(4)
  })
})
