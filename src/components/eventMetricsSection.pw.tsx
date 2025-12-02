/** @jsxImportSource @kitajs/html */

import { test, expect } from './eventMetricsSection.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('EventMetricsSection', () => {
  test('does not render when hasMetrics is false', async ({ eventMetrics }) => {
    await eventMetrics.setHasMetrics(false)
    await expect(eventMetrics.container).toHaveCount(0)
  })

  test.describe('Rendering when hasMetrics is true', () => {
    test.beforeEach(async ({ eventMetrics }) => {
      await eventMetrics.setHasMetrics(true)
    })

    test('renders section and header with title and toggle', async ({ eventMetrics, page }) => {
      await expect(eventMetrics.container).toBeVisible()
      await expect(eventMetrics.header).toBeVisible()

      await expect(eventMetrics.title).toHaveText('Event Metrics')
      await expect(eventMetrics.toggleHint).toHaveText(/Click to collapse/i)
    })

    test('renders provider filters container with expected attributes', async ({ eventMetrics }) => {
      const container = eventMetrics.providerFilters
      await expect(container).toHaveCount(1)
      await expect(container).toContainClass('join flex flex-wrap')
    })

    test('renders chart canvas element with correct id', async ({ eventMetrics }) => {
      await expect(eventMetrics.canvas).toHaveCount(1)
    })

    test('renders metric type toggle with Cost and Tokens buttons', async ({ eventMetrics }) => {
      await expect(eventMetrics.metricTypeToggle).toBeVisible()
      await expect(eventMetrics.costButton).toBeVisible()
      await expect(eventMetrics.tokensButton).toBeVisible()
    })

    test('Cost button is active by default', async ({ eventMetrics }) => {
      await expect(eventMetrics.costButton).toHaveAttribute('aria-pressed', 'true')
      await expect(eventMetrics.tokensButton).toHaveAttribute('aria-pressed', 'false')
    })
  })
})
