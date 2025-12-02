/** @jsxImportSource @kitajs/html */

import { test, expect } from './modelPerformanceSection.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('ModelPerformanceSection', () => {
  test.describe('Baseline rendering', () => {
    test('renders section, header, title, toggle label, and canvas', async ({ modelPerformance }) => {
      await expect(modelPerformance.section).toBeVisible()
      await expect(modelPerformance.header).toBeVisible()
      await expect(modelPerformance.title).toHaveText('Model Performance')
      await expect(modelPerformance.toggleLabel).toContainText('Click to expand')
      await expect(modelPerformance.canvas).toHaveCount(1)
    })

    test('has initial collapsed state and hidden content', async ({ modelPerformance }) => {
      await expect(modelPerformance.section).toContainClass('collapsed')
      await expect(modelPerformance.content).toContainClass('hidden')
    })

    test('renders provider filters container', async ({ modelPerformance }) => {
      await expect(modelPerformance.providerFilters).toHaveCount(1)
    })
  })

  test.describe('hasMetrics behavior', () => {
    test('does not show metric toggle buttons when false and data flag reflects false', async ({ modelPerformance }) => {
      await modelPerformance.setHasMetrics(false)
      await expect(modelPerformance.metricToggle).toHaveCount(1)
      await expect(modelPerformance.allButton).toHaveCount(0)
      await expect(modelPerformance.latencyButton).toHaveCount(0)
      await expect(modelPerformance.tpsButton).toHaveCount(0)
      await expect(modelPerformance.section).toHaveAttribute('data-has-metrics', 'false')
    })

    test('shows metric toggle buttons when true with correct labels and aria states; data flag reflects true', async ({ modelPerformance }) => {
      await modelPerformance.setHasMetrics(true)
      await expect(modelPerformance.allButton).toHaveCount(1)
      await expect(modelPerformance.latencyButton).toHaveCount(1)
      await expect(modelPerformance.tpsButton).toHaveCount(1)

      await expect(modelPerformance.allButton).toHaveText(/All/i)
      await expect(modelPerformance.latencyButton).toHaveText(/Latency/i)
      await expect(modelPerformance.tpsButton).toHaveText(/Tokens\/sec/i)

      await expect(modelPerformance.allButton).toHaveAttribute('aria-pressed', 'true')
      await expect(modelPerformance.latencyButton).toHaveAttribute('aria-pressed', 'false')
      await expect(modelPerformance.tpsButton).toHaveAttribute('aria-pressed', 'false')

      await expect(modelPerformance.section).toHaveAttribute('data-has-metrics', 'true')
    })
  })
})
