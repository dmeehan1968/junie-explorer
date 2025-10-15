/** @jsxImportSource @kitajs/html */

import { test, expect } from './eventFilters.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('EventFilters', () => {
  test('does not render when eventTypes is empty', async ({ eventFilters }) => {
    await eventFilters.setEventTypes([])
    await expect(eventFilters.allNoneToggle).toHaveCount(0)
    await expect(eventFilters.filterChips()).toHaveCount(0)
  })

  test.describe('Rendering when eventTypes is non-empty', () => {
    test('renders section and All/None toggle', async ({ eventFilters, page }) => {
      await eventFilters.setEventTypes(['ToolCall', 'Message'])

      // Basic content presence
      await expect(page.locator('body')).toContainText('Filter by Event Type:')
      await expect(page.locator('label', { hasText: 'All/None' })).toHaveCount(1)

      // Chips (excluding the all/none toggle)
      await expect(eventFilters.filterChips()).toHaveCount(2)
    })

    test('renders one filter per event type with correct label and attributes', async ({ eventFilters, page }) => {
      const items = ['ToolCall', 'Message', 'Action:Plan']
      await eventFilters.setEventTypes(items)

      // Count
      await expect(eventFilters.filterChips()).toHaveCount(items.length)

      // Labels and attributes
      for (const it of items) {
        const id = it
        const chip = eventFilters.filterByTypeId(id)
        await expect(chip).toBeVisible()
        await expect(chip.locator('label')).toHaveText(it)
        await expect(chip).toHaveAttribute('data-event-type', it)
      }
    })

    test('escapes special characters in labels and attributes', async ({ eventFilters }) => {
      const special = [
        '<click>',
        'value & more',
        'quote"double',
        "single'quote",
        'mix <&> "\'"'
      ]
      await eventFilters.setEventTypes(special)

      // Verify labels render literal characters (browser decodes HTML entities)
      for (const it of special) {
        const chip = eventFilters.filterByTypeId(it)
        await expect(chip.locator('label')).toHaveText(it)
        await expect(chip).toHaveAttribute('data-event-type', it)
      }
    })
  })
})
