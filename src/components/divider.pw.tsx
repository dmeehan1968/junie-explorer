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
      await expect(divider.root).toContainClass('divider')
      await expect(divider.root).toContainClass('divider-secondary')
      await expect(divider.root).toContainClass('m-8')
    })

    test('inner span has expected classes', async ({ divider }) => {
      await expect(divider.label).toContainClass('text-lg')
      await expect(divider.label).toContainClass('bg-secondary')
      await expect(divider.label).toContainClass('text-secondary-content')
      await expect(divider.label).toContainClass('rounded')
      await expect(divider.label).toContainClass('p-2')
    })
  })
})
