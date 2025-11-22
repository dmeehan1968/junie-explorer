/** @jsxImportSource @kitajs/html */

import { test, expect } from './sortIcon.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('SortIcon', () => {
  test('renders base svg container with common attributes', async ({ sortIcon }) => {
    await expect(sortIcon.svg).toHaveCount(1)
    await expect(sortIcon.rects).toHaveCount(4)
    await expect(sortIcon.polygon).toHaveCount(1)

    await expect(sortIcon.width).resolves.toBe('20')
    await expect(sortIcon.height).resolves.toBe('20')
    await expect(sortIcon.viewBox).resolves.toBe('0 0 24 24')
    await expect(sortIcon.ariaHidden).resolves.toBe('true')
  })

  test.describe('direction: asc', () => {
    test.beforeEach(async ({ sortIcon }) => {
      await sortIcon.setDirection('asc')
    })

    test('left bars widths increase from top to bottom', async ({ sortIcon }) => {
      // y positions 5, 10, 15
      await expect(sortIcon.rectAttr(0, 'y')).resolves.toBe('5')
      await expect(sortIcon.rectAttr(1, 'y')).resolves.toBe('10')
      await expect(sortIcon.rectAttr(2, 'y')).resolves.toBe('15')

      await expect(sortIcon.rectAttr(0, 'width')).resolves.toBe('6')
      await expect(sortIcon.rectAttr(1, 'width')).resolves.toBe('10')
      await expect(sortIcon.rectAttr(2, 'width')).resolves.toBe('14')
    })

    test('right vertical bar and triangle arrow up', async ({ sortIcon }) => {
      // right vertical bar index 3
      await expect(sortIcon.rectAttr(3, 'x')).resolves.toBe('20')
      await expect(sortIcon.rectAttr(3, 'y')).resolves.toBe('10')
      await expect(sortIcon.rectAttr(3, 'height')).resolves.toBe('8')

      await expect(sortIcon.polygonPoints()).resolves.toBe('21,5 23,10 19,10')
    })
  })

  test.describe('direction: desc', () => {
    test.beforeEach(async ({ sortIcon }) => {
      await sortIcon.setDirection('desc')
    })

    test('left bars widths decrease from top to bottom', async ({ sortIcon }) => {
      await expect(sortIcon.rectAttr(0, 'y')).resolves.toBe('5')
      await expect(sortIcon.rectAttr(1, 'y')).resolves.toBe('10')
      await expect(sortIcon.rectAttr(2, 'y')).resolves.toBe('15')

      await expect(sortIcon.rectAttr(0, 'width')).resolves.toBe('14')
      await expect(sortIcon.rectAttr(1, 'width')).resolves.toBe('10')
      await expect(sortIcon.rectAttr(2, 'width')).resolves.toBe('6')
    })

    test('right vertical bar and triangle arrow down', async ({ sortIcon }) => {
      await expect(sortIcon.rectAttr(3, 'x')).resolves.toBe('20')
      await expect(sortIcon.rectAttr(3, 'y')).resolves.toBe('6')
      await expect(sortIcon.rectAttr(3, 'height')).resolves.toBe('8')

      await expect(sortIcon.polygonPoints()).resolves.toBe('19,14 23,14 21,19')
    })
  })

  test('updates when direction prop changes', async ({ sortIcon }) => {
    await sortIcon.setDirection('asc')
    await expect(sortIcon.polygonPoints()).resolves.toBe('21,5 23,10 19,10')

    await sortIcon.setDirection('desc')
    await expect(sortIcon.polygonPoints()).resolves.toBe('19,14 23,14 21,19')
  })
})
