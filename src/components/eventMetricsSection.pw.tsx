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

    test('renders section and header with title and toggle', async ({ eventMetrics }) => {
      await expect(eventMetrics.container).toBeVisible()
      await expect(eventMetrics.header).toBeVisible()

      await expect(eventMetrics.title).toHaveText('Event Metrics')
      await expect(eventMetrics.toggleHint).toHaveText(/Click to expand/i)
    })

    test('is collapsed by default', async ({ eventMetrics }) => {
      await expect(eventMetrics.container).toHaveClass(/collapsed/)
      await expect(eventMetrics.content).toHaveClass(/hidden/)
      await expect(eventMetrics.toggleHint).toHaveText(/Click to expand/i)
    })
  })
})
