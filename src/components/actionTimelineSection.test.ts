import { expect } from "../playwright/test.js"
import { test } from "./actionTimelineSection.dsl.js"

// Tests target the trajectories view for a specific fixture route
// /project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories

test.describe('ActionTimelineSection', () => {
  test.beforeEach(async ({ actionTimeline }) => {
    await actionTimeline.navigateTo()
  })

  test('should render the action timeline section when action events exist', async ({ actionTimeline }) => {
    await expect(actionTimeline.section).toBeVisible()
    await expect(actionTimeline.header).toContainText('Action Timeline')
    // sanity: shows a count in parentheses, e.g. (3)
    await expect(actionTimeline.header).toHaveText(/Action Timeline\s*\(\d+\)/)
  })

  test.describe('Expand/Collapse behavior (client-side)', () => {
    test('should toggle between collapsed and expanded states', async ({ actionTimeline }) => {
      // Starts collapsed
      await expect(actionTimeline.content).toBeHidden()
      await expect(actionTimeline.toggleText).toHaveText('Click to expand')

      // Expand
      await actionTimeline.expand()
      await expect(actionTimeline.content).toBeVisible()
      await expect(actionTimeline.toggleText).toHaveText('Click to collapse')

      // Collapse back
      await actionTimeline.collapse()
      await expect(actionTimeline.content).toBeHidden()
      await expect(actionTimeline.toggleText).toHaveText('Click to expand')
    })
  })

  test.describe('Chart canvas rendering (screenshot)', () => {
    test('should render chart on expand and match canvas screenshot', async ({ actionTimeline }) => {
      await actionTimeline.expand()

      // Ensure the canvas is visible and chart instance exists
      await expect(actionTimeline.canvas).toBeVisible()

      // Give Chart.js a brief moment to complete layout before snapshot
      await actionTimeline.pause(100)

      // Snapshot the canvas only for deterministic comparisons
      await expect(actionTimeline.canvas).toHaveScreenshot()
    })
  })
})
