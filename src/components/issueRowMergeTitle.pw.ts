import { expect } from "../playwright/test-utils"
import { test } from "./issuesTable.dsl"

test.describe('IssueRow Merge Title', async () => {
  test.beforeEach(async ({ page, issuesTable }) => {
    await issuesTable.navigateToProject('aia-only-test')
    
    // Ensure issues are unmerged for test isolation
    const rows = await issuesTable.getAllRows()
    if (rows.length === 1) {
      const firstRow = rows[0]
      await firstRow.descriptionCell.hover()
      const unmergeVisible = await firstRow.unmergeButton.isVisible()
      if (unmergeVisible) {
        page.once('dialog', async dialog => {
          await dialog.accept()
        })
        await firstRow.unmergeButton.click()
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('Merge Up should use the title of the clicked issue', async ({ page, issuesTable }) => {
    let rows = await issuesTable.getAllRows()
    expect(rows.length).toBeGreaterThanOrEqual(2)
    
    // Edit the second issue's title to something unique
    const secondRow = rows[1]
    await secondRow.descriptionCell.hover()
    await secondRow.editDescriptionButton.click()
    const input = secondRow.descriptionCell.locator('input')
    const uniqueTitle = `Unique Title ${Date.now()}`
    await input.fill(uniqueTitle)
    await input.press('Enter')
    // Wait for the input to disappear and title to update
    await expect(input).not.toBeVisible()
    
    // Re-fetch rows to get updated state
    rows = await issuesTable.getAllRows()
    const updatedSecondTitle = await rows[1].descriptionCell.locator('a[data-testid="issue-description-link"]').textContent()
    expect(updatedSecondTitle?.trim()).toBe(uniqueTitle)
    
    // Merge Up (click second row merge button)
    await rows[1].descriptionCell.hover()
    
    page.once('dialog', async dialog => {
      console.log('Dialog appeared: ' + dialog.message())
      await dialog.accept()
    })
    
    console.log('Clicking merge up button')
    await rows[1].mergeUpButton.click()
    
    console.log('Waiting for navigation/reload')
    await page.waitForLoadState('load')
    await page.waitForTimeout(2000) // Give it some time to actually settle
    
    // Verify the resulting single issue has the unique title
    const finalRows = await issuesTable.getAllRows()
    expect(finalRows.length).toBe(1)
    const finalTitle = await finalRows[0].descriptionCell.locator('a[data-testid="issue-description-link"]').textContent()
    
    expect(finalTitle?.trim()).toBe(uniqueTitle)
  })
})
