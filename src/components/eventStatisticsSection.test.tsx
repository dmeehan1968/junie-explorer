/** @jsxImportSource @kitajs/html */

import { test, expect } from './eventStatisticsSection.dsl.js'

function ms(n: number) { return new Date(n) }

// Helper to build an event record quickly
function ev(type: string, atMs: number) {
  return { event: { type }, timestamp: ms(atMs) } as any
}

// Tests grouped by feature/prop per guidelines

test.describe('EventStatisticsSection', () => {
  test('does not render when events is empty', async ({ eventStats }) => {
    await eventStats.setTaskEventTypes([])
    await eventStats.setEvents([])
    await expect(eventStats.container).toHaveCount(0)
  })

  test.describe('Rendering with events', () => {
    const A = 'assistant'
    const B = 'tool'

    test.beforeEach(async ({ eventStats }) => {
      // Chronological events
      // t0 A (0ms)
      // t1 A (100ms since prev)
      // t2 B (300ms since prev)
      // t3 A (100ms since prev)
      const base = 1_000
      const events = [
        ev(A, base),
        ev(A, base + 100),
        ev(B, base + 400),
        ev(A, base + 500),
      ]
      await eventStats.setTaskEventTypes([A, B])
      await eventStats.setEvents(events)
    })

    test('renders section and header with title and toggle', async ({ eventStats }) => {
      await expect(eventStats.container).toBeVisible()
      await expect(eventStats.header).toBeVisible()
      await expect(eventStats.title).toHaveText('Event Type Statistics')
      await expect(eventStats.toggleHint).toHaveText(/Click to expand/i)
    })

    test('initial content is collapsed/hidden', async ({ eventStats }) => {
      await expect(eventStats.content).toHaveClass(/hidden/)
    })

    test('renders table with one row per present event type', async ({ eventStats }) => {
      await expect(eventStats.table).toHaveCount(1)
      await expect(eventStats.rowByEventType('assistant')).toHaveCount(1)
      await expect(eventStats.rowByEventType('tool')).toHaveCount(1)
    })

    test('computes Sample Count, Min, Max, and rounded Avg per type', async ({ eventStats }) => {
      // assistant durations: [0, 100, 100] → count 3, min 0, max 100, avg 66.6 → 67
      const aCells = await eventStats.rowCells('assistant')
      await expect(aCells.nth(0)).toHaveText('assistant')
      await expect(aCells.nth(1)).toHaveText('3')
      await expect(aCells.nth(2)).toHaveText('0')
      await expect(aCells.nth(3)).toHaveText('100')
      await expect(aCells.nth(4)).toHaveText('67')

      // tool durations: [300] → count 1, min 300, max 300, avg 300
      const bCells = await eventStats.rowCells('tool')
      await expect(bCells.nth(0)).toHaveText('tool')
      await expect(bCells.nth(1)).toHaveText('1')
      await expect(bCells.nth(2)).toHaveText('300')
      await expect(bCells.nth(3)).toHaveText('300')
      await expect(bCells.nth(4)).toHaveText('300')
    })
  })

  test.describe('Escaping behavior', () => {
    const Escaped = 'tool:call<xml>'

    test.beforeEach(async ({ eventStats }) => {
      const base = 10_000
      const events = [
        ev(Escaped, base),
        ev(Escaped, base + 50),
      ]
      await eventStats.setTaskEventTypes([Escaped])
      await eventStats.setEvents(events)
    })

    test('renders visible text with special chars and correct stats', async ({ eventStats }) => {
      // Query the first row directly to avoid ambiguity with nested HTML escaping in attributes
      const row = eventStats.table.locator('tbody tr').first()
      await expect(row).toHaveCount(1)

      const cells = row.locator('td')
      await expect(cells.nth(0)).toHaveText(Escaped)
      await expect(cells.nth(1)).toHaveText('2')
      await expect(cells.nth(2)).toHaveText('0')
      await expect(cells.nth(3)).toHaveText('50')
      await expect(cells.nth(4)).toHaveText('25')
    })
  })
})
