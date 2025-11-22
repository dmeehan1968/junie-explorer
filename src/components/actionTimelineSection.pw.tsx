/** @jsxImportSource @kitajs/html */

import { test, expect } from './actionTimelineSection.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('ActionTimelineSection', () => {
  test('does not render when hasActionEvents is false', async ({ actionTimeline }) => {
    await actionTimeline.setHasActionEvents(false)
    await expect(actionTimeline.section).toHaveCount(0)
  })

  test.describe('Rendering when hasActionEvents is true', () => {
    test('renders section with header, count, and canvas in DOM', async ({ actionTimeline, page }) => {
      await actionTimeline.setProps({ hasActionEvents: true, actionCount: 3 })

      await expect(actionTimeline.section).toBeVisible()
      await expect(actionTimeline.header).toBeVisible()
      await expect(actionTimeline.title).toContainText('(3)')
      await expect(actionTimeline.toggleLabel).toContainText('Click to expand')
      // Canvas exists but is inside hidden collapsible content initially
      await expect(actionTimeline.canvas).toHaveCount(1)
    })

    test('updates count in header when actionCount changes', async ({ actionTimeline }) => {
      await actionTimeline.setProps({ hasActionEvents: true, actionCount: 0 })
      await expect(actionTimeline.title).toContainText('(0)')

      await actionTimeline.setActionCount(5)
      await expect(actionTimeline.title).toContainText('(5)')
    })

    test('has initial collapsed state class on section and hidden content', async ({ actionTimeline, page }) => {
      await actionTimeline.setProps({ hasActionEvents: true, actionCount: 1 })

      // Section should have the 'collapsed' class initially
      await expect(actionTimeline.section).toContainClass('collapsed')

      // Collapsible content is hidden by default
      const content = page.locator('.collapsible-content')
      await expect(content).toContainClass('hidden')
    })
  })
})
