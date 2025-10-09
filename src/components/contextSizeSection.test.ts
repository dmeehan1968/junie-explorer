import { expect } from "../playwright/test.js"
import { test } from "./contextSizeSection.dsl.js"

// Tests target the trajectories view for a specific fixture route
// /project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories

test.describe('ContextSizeSection', () => {
  test.beforeEach(async ({ contextSize }) => {
    await contextSize.navigateTo()
  })

  test('should render the context size section', async ({ contextSize }) => {
    await expect(contextSize.section).toBeVisible()
    await expect(contextSize.header).toContainText('Context')
  })

  test.describe('Expand/Collapse behavior (client-side)', () => {
    test('should toggle between collapsed and expanded states', async ({ contextSize }) => {
      // Starts collapsed
      await expect(contextSize.content).toBeHidden()
      await expect(contextSize.toggleText).toHaveText('Click to expand')

      // Expand
      await contextSize.expand()
      await expect(contextSize.content).toBeVisible()
      await expect(contextSize.toggleText).toHaveText('Click to collapse')

      // Collapse back
      await contextSize.collapse()
      await expect(contextSize.content).toBeHidden()
      await expect(contextSize.toggleText).toHaveText('Click to expand')
    })
  })

  test.describe('Chart canvas rendering (screenshot)', () => {
    test('should render chart on expand and match canvas screenshot', async ({ contextSize }) => {
      await contextSize.expand()

      // Ensure the canvas is visible and chart instance has drawn
      await expect(contextSize.canvas).toBeVisible()
      await contextSize.pause(120)

      // Snapshot the canvas only for deterministic comparisons
      await expect(contextSize.canvas).toHaveScreenshot()
    })
  })

  test.describe('Filters: provider options (screenshot)', () => {
    test('should update chart for each provider filter option', async ({ contextSize }) => {
      await contextSize.expand()

      const providerCount = await contextSize.providerButtons.count()
      expect(providerCount).toBeGreaterThan(0)

      for (let i = 0; i < providerCount; i++) {
        await contextSize.selectProviderByIndex(i)
        await contextSize.pause(80)
        await expect(contextSize.canvas).toHaveScreenshot({
          animations: 'disabled',
          mask: [],
          timeout: 5000,
        })
      }
    })
  })

  test.describe('Include all tasks toggle', () => {
    test('should be hidden', async ({ contextSize }) => {
      await contextSize.expand()
      await expect(contextSize.includeAllTasksToggle).toBeHidden()
    })
  })
})
