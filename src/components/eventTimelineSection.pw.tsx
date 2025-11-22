/** @jsxImportSource @kitajs/html */

import { test, expect } from './eventTimelineSection.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('EventTimelineSection', () => {
  test('does not render when events is empty', async ({ eventTimeline }) => {
    await eventTimeline.setEvents([])
    await expect(eventTimeline.container).toHaveCount(0)
  })

  test.describe('Rendering when events exist', () => {
    test.beforeEach(async ({ eventTimeline }) => {
      const e = eventTimeline.record({ type: 'AnyEvent' }, new Date(0))
      await eventTimeline.setEvents([e])
    })

    test('renders section and header with title and toggle', async ({ eventTimeline }) => {
      await expect(eventTimeline.container).toBeVisible()
      await expect(eventTimeline.header).toBeVisible()

      await expect(eventTimeline.title).toHaveText('Event Timeline')
      await expect(eventTimeline.toggleHint).toHaveText('Click to expand')
    })

    test('content is hidden by default', async ({ eventTimeline }) => {
      await expect(eventTimeline.content).toHaveCount(1)
      await expect(eventTimeline.content).toContainClass('hidden')
    })

    test('renders chart canvas element with correct id', async ({ eventTimeline }) => {
      await expect(eventTimeline.canvas).toHaveCount(1)
      await expect(eventTimeline.canvas).toHaveAttribute('id', 'event-timeline-chart')
    })
  })
})
