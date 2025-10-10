/** @jsxImportSource @kitajs/html */

import { test, expect } from './expandIcon.dsl.js'

test.describe('ExpandIcon (component)', () => {
  test('renders expected SVG structure and attributes', async ({ page, expandIcon }) => {

    await expect(expandIcon.svg).toBeVisible()
    await expect(expandIcon.height).resolves.toEqual(24)
    await expect(expandIcon.width).resolves.toEqual(24)
    await expect(expandIcon.viewBox).resolves.toEqual('0 0 24 24')
    await expect(expandIcon.stroke).resolves.toEqual('currentColor')
    await expect(expandIcon.strokeWidth).resolves.toEqual(1.5)
    await expect(expandIcon.strokeLineCap).resolves.toEqual('round')
    await expect(expandIcon.strokeLineJoin).resolves.toEqual('round')

    await expect(expandIcon.paths).toHaveCount(4)
  })
})
