import { expect } from "../playwright/test-utils"
import { test } from "./issuesTable.dsl"

test.describe('IssueRow', async () => {
  test.beforeEach(async ({ issuesTable }) => {
    await issuesTable.navigateToProject('default.999999')
  })

  test('assistant provider icons should have a tooltip', async ({ issuesTable }) => {
    const rows = await issuesTable.getAllRows()
    expect(rows.length).toBeGreaterThan(0)
    const firstRow = rows[0]
    
    // The cell containing the icons
    const cell = firstRow.assistantProvidersCell
    
    // We expect at least one icon in the default project's first issue (based on existing tests)
    // We want to find elements with class 'tooltip' inside the cell
    const tooltips = cell.locator('.tooltip')
    
    // This assertion should fail before the fix
    await expect(tooltips.first()).toBeVisible()
    await expect(tooltips.first()).toHaveAttribute('data-tip')
    await expect(tooltips.first()).toHaveClass(/tooltip-left/)
  })
})
