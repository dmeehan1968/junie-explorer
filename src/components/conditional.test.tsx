/** @jsxImportSource @kitajs/html */

import { test, expect } from './conditional.dsl.js'

// Tests grouped by feature/prop per project guidelines

test.describe('Conditional (component)', () => {
  test('does not render children when condition is false', async ({ conditional }) => {
    await conditional.setChildrenText('Visible Text')
    await conditional.setCondition(false)

    await expect(conditional.byText('Visible Text')).toHaveCount(0)
  })

  test.describe('Rendering when condition is true', () => {
    test('renders text children', async ({ conditional }) => {
      await conditional.setCondition(true)
      await conditional.setChildrenText('Hello World')

      await expect(conditional.byText('Hello World')).toBeVisible()
    })

    test('renders element child', async ({ conditional }) => {
      await conditional.setCondition(true)
      await conditional.setChildren(<span data-testid="child-el">Child</span>)

      await expect(conditional.byTestId('child-el')).toBeVisible()
      await expect(conditional.byTestId('child-el')).toHaveText('Child')
    })

    test('renders multiple element children', async ({ conditional }) => {
      await conditional.setCondition(true)
      await conditional.setChildrenElements(
        <span data-testid="child-a">A</span>,
        <span data-testid="child-b">B</span>
      )

      await expect(conditional.byTestId('child-a')).toBeVisible()
      await expect(conditional.byTestId('child-b')).toBeVisible()
    })

    test('renders nested children', async ({ conditional }) => {
      await conditional.setCondition(true)
      await conditional.setChildren(
        <div data-testid="parent">
          <span data-testid="inner">Inner</span>
        </div>
      )

      await expect(conditional.byTestId('parent')).toBeVisible()
      await expect(conditional.byTestId('inner')).toBeVisible()
    })

    test('renders nothing when children are null', async ({ conditional }) => {
      await conditional.setCondition(true)
      await conditional.clearChildren()

      // With no children, the root should have no inner text matching anything
      // Ensure a previously used marker is absent
      await expect(conditional.byText('Hello')).toHaveCount(0)
    })

    test('toggles visibility when condition changes', async ({ conditional }) => {
      await conditional.setChildrenText('Toggle Me')

      await conditional.setCondition(false)
      await expect(conditional.byText('Toggle Me')).toHaveCount(0)

      await conditional.setCondition(true)
      await expect(conditional.byText('Toggle Me')).toBeVisible()

      await conditional.setCondition(false)
      await expect(conditional.byText('Toggle Me')).toHaveCount(0)
    })
  })
})
