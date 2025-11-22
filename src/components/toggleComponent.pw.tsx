/** @jsxImportSource @kitajs/html */

import { test, expect } from './toggleComponent.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('ToggleComponent', () => {
  test('renders with default testId and base attributes', async ({ toggle, page }) => {
    // default props are used by DSL
    await expect(toggle.button).toBeVisible()
    await expect(toggle.button).toHaveAttribute('data-testid', 'toggle')
    await expect(toggle.button).toHaveAttribute('data-expanded', 'false')
    await expect(toggle.button).toHaveAttribute('title', 'Toggle content')

    // has base class
    await expect(toggle.button).toContainClass('content-toggle-btn')

    // onclick attribute exists (handler is external)
    const onclick = await toggle.button.getAttribute('onclick')
    expect(onclick).toBeTruthy()
  })

  test('respects custom testId', async ({ toggle, page }) => {
    await toggle.setTestId('custom-toggle')
    const customButton = page.getByTestId('custom-toggle')
    await expect(customButton).toBeVisible()
  })

  test.describe('Icons', () => {
    test('renders expandIcon content in .expand-icon', async ({ toggle }) => {
      await toggle.setExpandIcon(<span>EXPAND</span>)
      await expect(toggle.expandIcon).toContainText('EXPAND')
      // expand icon is visible by default
      await expect(toggle.expandIcon).toBeVisible()
    })

    test('renders collapseIcon content in .collapse-icon and is hidden initially', async ({ toggle }) => {
      await toggle.setCollapseIcon(<span>COLLAPSE</span>)
      await expect(toggle.collapseIcon).toContainText('COLLAPSE')
      await expect(toggle.collapseIcon).toContainClass('hidden')
    })
  })
})
