/** @jsxImportSource @kitajs/html */

import { test, expect } from './contextSizeSection.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('ContextSizeSection', () => {
  test.describe('Baseline rendering', () => {
    test('renders section, header, title, toggle label, and canvas', async ({ contextSize }) => {
      await expect(contextSize.section).toBeVisible()
      await expect(contextSize.header).toBeVisible()
      await expect(contextSize.title).toHaveText('Context')
      await expect(contextSize.toggleLabel).toContainText('Click to expand')
      await expect(contextSize.canvas).toHaveCount(1)
    })

    test('has initial collapsed state and hidden content', async ({ contextSize }) => {
      await expect(contextSize.section).toContainClass('collapsed')
      await expect(contextSize.content).toContainClass('hidden')
    })

    test('renders provider filters container', async ({ contextSize }) => {
      await expect(contextSize.providerFilters).toHaveCount(1)
    })
  })

  test.describe('showIncludeAllTasks behavior', () => {
    test('does not show checkbox and label when false', async ({ contextSize }) => {
      await contextSize.setShowIncludeAllTasks(false)
      await expect(contextSize.allTasksToggle).toHaveCount(0)
      await expect(contextSize.allTasksLabel).toHaveCount(0)
    })

    test('shows checkbox and label when true', async ({ contextSize }) => {
      await contextSize.setShowIncludeAllTasks(true)
      await expect(contextSize.allTasksToggle).toHaveCount(1)
      // Label is in hidden collapsible content initially; just assert it exists with correct text
      await expect(contextSize.allTasksLabel).toHaveText('Include all tasks in issue')
    })
  })
})
