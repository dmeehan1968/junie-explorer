import { expect } from "../playwright/test-utils"
import { test } from "./issuesTable.dsl"

test.describe('IssueRow Unmerge Title', async () => {
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

  test('Unmerging should restore original titles', async ({ page, issuesTable }) => {
    let rows = await issuesTable.getAllRows()
    expect(rows.length).toBeGreaterThanOrEqual(2)
    
    // Set custom titles for both issues
    const row0 = rows[0]
    await row0.descriptionCell.hover()
    await row0.editDescriptionButton.click()
    const input0 = row0.descriptionCell.locator('input')
    const customTitle0 = `Custom Title A ${Date.now()}`
    await input0.fill(customTitle0)
    await input0.press('Enter')
    await expect(input0).not.toBeVisible()

    const row1 = rows[1]
    await row1.descriptionCell.hover()
    await row1.editDescriptionButton.click()
    const input1 = row1.descriptionCell.locator('input')
    const customTitle1 = `Custom Title B ${Date.now()}`
    await input1.fill(customTitle1)
    await input1.press('Enter')
    await expect(input1).not.toBeVisible()

    console.log(`Custom titles before merge: "${customTitle0}", "${customTitle1}"`)

    // Merge Down (first row merge button)
    await rows[0].descriptionCell.hover()
    page.once('dialog', async dialog => {
      await dialog.accept()
    })
    await rows[0].mergeDownButton.click()
    await page.waitForLoadState('networkidle')
    
    // Now merged.
    await page.waitForTimeout(1000)
    rows = await issuesTable.getAllRows()
    expect(rows.length).toBe(1)
    
    // Unmerge
    await rows[0].descriptionCell.hover()
    page.once('dialog', async dialog => {
      await dialog.accept()
    })
    await rows[0].unmergeButton.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Verify rows are back and have ORIGINAL log titles (not the custom ones we set)
    const finalRows = await issuesTable.getAllRows()
    expect(finalRows.length).toBeGreaterThanOrEqual(2)
    
    const finalFirstTitle = (await finalRows[0].descriptionCell.locator('a[data-testid="issue-description-link"]').textContent())?.trim()
    const finalSecondTitle = (await finalRows[1].descriptionCell.locator('a[data-testid="issue-description-link"]').textContent())?.trim()
    
    console.log(`Final titles after unmerge: "${finalFirstTitle}", "${finalSecondTitle}"`)
    
    // These are the titles from the JSONL files in the fixture
    expect(finalFirstTitle).toBe("Source Issue Task")
    expect(finalSecondTitle).toBe("Target Issue Task")
  })
})
