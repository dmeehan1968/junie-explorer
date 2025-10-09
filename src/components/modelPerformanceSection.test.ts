import { expect } from "../playwright/test.js"
import { test } from "./modelPerformanceSection.dsl.js"

// Tests target the trajectories view for a specific fixture route
// /project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories

test.describe('ModelPerformanceSection', () => {
  test.beforeEach(async ({ modelPerformance }) => {
    await modelPerformance.navigateTo()
  })

  test('should render the model performance section', async ({ modelPerformance }) => {
    await expect(modelPerformance.section).toBeVisible()
    await expect(modelPerformance.header).toContainText('Model Performance')
  })

  test.describe('Expand/Collapse behavior (client-side)', () => {
    test('should toggle between collapsed and expanded states', async ({ modelPerformance }) => {
      // Starts collapsed
      await expect(modelPerformance.content).toBeHidden()
      await expect(modelPerformance.toggleText).toHaveText('Click to expand')

      // Expand
      await modelPerformance.expand()
      await expect(modelPerformance.content).toBeVisible()
      await expect(modelPerformance.toggleText).toHaveText('Click to collapse')

      // Collapse back
      await modelPerformance.collapse()
      await expect(modelPerformance.content).toBeHidden()
      await expect(modelPerformance.toggleText).toHaveText('Click to expand')
    })
  })

  test.describe('Chart canvas rendering (screenshot)', () => {
    test('should render chart on expand and match canvas screenshot', async ({ modelPerformance }) => {
      await modelPerformance.expand()

      // Ensure the canvas is visible and chart instance has drawn
      await expect(modelPerformance.canvas).toBeVisible()
      await modelPerformance.pause(120)

      // Snapshot the canvas only for deterministic comparisons
      await expect(modelPerformance.canvas).toHaveScreenshot()
    })
  })

  test.describe('Filters: metric modes and providers (screenshot)', () => {
    test('should update chart for each metric and provider filter option', async ({ modelPerformance, page }) => {
      await modelPerformance.expand()

      // Discover metric buttons available in this fixture (handles hasMetrics=false)
      const metricCount = await modelPerformance.metricButtons.count()
      const metrics: ("both"|"latency"|"tps")[] = []
      for (let i = 0; i < metricCount; i++) {
        const value = await modelPerformance.metricButtons.nth(i).getAttribute('data-metric')
        if (value === 'both' || value === 'latency' || value === 'tps') metrics.push(value)
      }

      // Fallback if no buttons are present (should not happen): default to latency
      if (metrics.length === 0) metrics.push('latency')

      // Collect provider buttons (includes "Both" + providers)
      const providerCount = await modelPerformance.providerButtons.count()
      expect(providerCount).toBeGreaterThan(0)

      // Iterate metric -> providers; take a screenshot per selection
      for (const metric of metrics) {
        await test.step('should render chart for metric ' + metric + ' and provider(s)', async () => {
          await modelPerformance.selectMetric(metric)
          // brief pause to allow re-render
          await modelPerformance.pause(80)

          for (let i = 0; i < providerCount; i++) {
            const btn = modelPerformance.providerButtons.nth(i)
            const label = (await btn.textContent())?.trim() || `provider-${i}`
            await btn.click()
            await modelPerformance.pause(80)
            await expect(modelPerformance.canvas).toHaveScreenshot({
              animations: 'disabled',
              mask: [],
              timeout: 5000,
            })
          }
        })
      }
    })
  })
})
