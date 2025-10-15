/** @jsxImportSource @kitajs/html */

import { test, expect } from './eventsTable.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('EventsTable', () => {
  test('renders empty state when no events', async ({ eventsTable }) => {
    await eventsTable.setEvents([])
    await expect(eventsTable.noEvents).toHaveText('No events found for this task')
    await expect(eventsTable.table).toHaveCount(0)
  })

  test.describe('Rendering rows', () => {
    test('renders one row per event with stable testids', async ({ eventsTable }) => {
      const e1 = eventsTable.record({ type: 'ToolCallEvent', foo: 'bar' }, new Date('2024-01-01T00:00:00.000Z'))
      const e2 = eventsTable.record({ type: 'MessageEvent', text: 'hi' }, new Date('2024-01-01T00:00:01.234Z'))
      await eventsTable.setEvents([e1, e2])

      await expect(eventsTable.table).toBeVisible()
      await expect(eventsTable.rows).toHaveCount(2)
      await expect(eventsTable.row(0)).toBeVisible()
      await expect(eventsTable.row(1)).toBeVisible()
    })

    test('formats timestamp as HH:MM:SS.mmm with zero padding', async ({ eventsTable }) => {
      const date = new Date(0)
      date.setHours(3); date.setMinutes(4); date.setSeconds(5); date.setMilliseconds(6)
      const e = eventsTable.record({ type: 'AnyEvent' }, date)
      await eventsTable.setEvents([e])
      await expect(eventsTable.timestampCell(0)).toHaveText('03:04:05.006')
    })

    test('renders event type; marks parse errors and applies error styling', async ({ eventsTable }) => {
      const ok = eventsTable.record({ type: 'OkEvent' }, new Date(0))
      const bad = eventsTable.record({ type: 'Bad<Event>&' }, new Date(0), { message: 'oops' })
      await eventsTable.setEvents([ok, bad])

      await expect(eventsTable.typeCell(0)).toHaveText('OkEvent')
      // label includes literal characters; escaping handled safely
      await expect(eventsTable.typeCell(1)).toContainText('Bad<Event>&(parseError)')
      await expect(eventsTable.typeCell(1)).toHaveClass(/bg-red-100/)
      await expect(eventsTable.typeCell(1)).toHaveClass(/text-red-800/)
    })

    test('renders pretty JSON with escaped content', async ({ eventsTable }) => {
      const payload = { a: '<tag>', b: 'x & y', c: '"quoted"', d: "'single'" }
      const e = eventsTable.record({ type: 'Custom', payload }, new Date(0))
      await eventsTable.setEvents([e])

      // Browser decodes HTML entities in textContent; check readable text
      const jsonText = await eventsTable.jsonCell(0).textContent()
      expect(jsonText).toContain('"type": "Custom"')
      expect(jsonText).toContain('"payload"')
      expect(jsonText).toContain('"a": "<tag>"')
      expect(jsonText).toContain('"b": "x & y"')
      expect(jsonText).toContain('"c": "\\"quoted\\""')
      expect(jsonText).toContain("\"d\": \"'single'\"")
    })

    test('shows per-row cost for LlmResponseEvent and dash for others; totals only response costs', async ({ eventsTable }) => {
      const req = eventsTable.record({ type: 'LlmRequestEvent', id: '1' }, new Date(0))
      const res1 = eventsTable.record({ type: 'LlmResponseEvent', id: '1', answer: { cost: 0.123456 } }, new Date(0))
      const other = eventsTable.record({ type: 'ToolCallEvent' }, new Date(0))
      const res2 = eventsTable.record({ type: 'LlmResponseEvent', id: '2', answer: { cost: 1.2 } }, new Date(0))
      await eventsTable.setEvents([req, res1, other, res2])

      await expect(eventsTable.costCell(0)).toHaveText('-')
      await expect(eventsTable.costCell(1)).toHaveText('0.1235')
      await expect(eventsTable.costCell(2)).toHaveText('-')
      await expect(eventsTable.costCell(3)).toHaveText('1.2000')

      // total = 0.123456 + 1.2 => 1.323456 => 1.3235 after toFixed(4)
      await expect(eventsTable.totalCostCell).toHaveText('1.3235')
    })
  })
})
