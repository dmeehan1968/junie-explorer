/** @jsxImportSource @kitajs/html */

import { test, expect } from './divider.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('Divider', () => {
  test('applies the id to the root element', async ({ divider }) => {
    await divider.setId('my-divider')
    await expect(divider.root).toHaveAttribute('id', 'my-divider')
  })

  test.describe('children rendering', () => {
    test('renders children text inside the label span', async ({ divider }) => {
      await divider.setChildrenText('Hello World')
      await expect(divider.label).toContainText('Hello World')
    })

    test('renders children elements inside the label span', async ({ divider }) => {
      await divider.setChildrenElements(
        <span data-testid="child-1">One</span>,
        <span data-testid="child-2">Two</span>,
      )

      await expect(divider.label.locator('[data-testid="child-1"]')).toHaveCount(1)
      await expect(divider.label.locator('[data-testid="child-2"]')).toHaveCount(1)
      await expect(divider.label).toContainText('One')
      await expect(divider.label).toContainText('Two')
    })
  })

  test.describe('class names', () => {
    test('root div has expected classes', async ({ divider }) => {
      await divider.setId('root-class-check')
      await expect(divider.root).toHaveClass(/\bdivider\b/)
      await expect(divider.root).toHaveClass(/\bdivider-secondary\b/)
      await expect(divider.root).toHaveClass(/\bm-8\b/)
    })

    test('inner span has expected classes', async ({ divider }) => {
      await expect(divider.label).toHaveClass(/\btext-lg\b/)
      await expect(divider.label).toHaveClass(/\bbg-secondary\b/)
      await expect(divider.label).toHaveClass(/\btext-secondary-content\b/)
      await expect(divider.label).toHaveClass(/\brounded\b/)
      await expect(divider.label).toHaveClass(/\bp-2\b/)
    })
  })
})
