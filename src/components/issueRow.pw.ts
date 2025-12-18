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

  test('agent cell should display Junie icon for non-AIA issues', async ({ issuesTable }) => {
    const rows = await issuesTable.getAllRows()
    expect(rows.length).toBeGreaterThan(0)
    const firstRow = rows[0]
    
    const agentCell = firstRow.agentCell
    await expect(agentCell).toBeVisible()
    
    // The icon should be visible with the Junie icon URL
    const icon = agentCell.locator('[role="img"]')
    await expect(icon).toBeVisible()
    await expect(icon).toHaveAttribute('aria-label', 'Junie icon')
  })
})

test.describe('IssueRow - AIA Issues', async () => {
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

  test('merge buttons should be inside description cell next to edit button', async ({ issuesTable }) => {
    const rows = await issuesTable.getAllRows()
    expect(rows.length).toBeGreaterThanOrEqual(2)
    
    // First row: merge-down visible (has next AIA row), merge-up hidden (no prev)
    const firstRow = rows[0]
    await firstRow.descriptionCell.hover()
    await expect(firstRow.editDescriptionButton).toBeVisible()
    await expect(firstRow.mergeDownButton).toBeVisible()
    
    // Second row: merge-up visible (has prev AIA row), merge-down hidden (no next)
    const secondRow = rows[1]
    await secondRow.descriptionCell.hover()
    await expect(secondRow.editDescriptionButton).toBeVisible()
    await expect(secondRow.mergeUpButton).toBeVisible()
  })

  test('merge up button should have git-style merge icon', async ({ issuesTable }) => {
    const rows = await issuesTable.getAllRows()
    expect(rows.length).toBeGreaterThanOrEqual(2)
    
    // Use second row which has merge-up visible
    const secondRow = rows[1]
    await secondRow.descriptionCell.hover()

    // Check that merge up button has the correct aria-label
    await expect(secondRow.mergeUpButton).toHaveAttribute('aria-label', 'Merge with issue above')
    
    // Check for SVG icon inside the button
    const svg = secondRow.mergeUpButton.locator('svg')
    await expect(svg).toBeVisible()
  })

  test('merge down button should have git-style merge icon', async ({ issuesTable }) => {
    const rows = await issuesTable.getAllRows()
    expect(rows.length).toBeGreaterThanOrEqual(2)
    
    // Use first row which has merge-down visible
    const firstRow = rows[0]
    await firstRow.descriptionCell.hover()

    // Check that merge down button has the correct aria-label
    await expect(firstRow.mergeDownButton).toHaveAttribute('aria-label', 'Merge with issue below')
    
    // Check for SVG icon inside the button
    const svg = firstRow.mergeDownButton.locator('svg')
    await expect(svg).toBeVisible()
  })

  test('clicking merge down button should trigger confirmation dialog', async ({ page, issuesTable }) => {
    const rows = await issuesTable.getAllRows()
    expect(rows.length).toBeGreaterThanOrEqual(2)
    
    const firstRow = rows[0]
    await firstRow.descriptionCell.hover()
    
    // Set up dialog handler to capture the confirmation
    let dialogMessage = ''
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message()
      await dialog.dismiss()
    })
    
    // Click the merge down button
    await firstRow.mergeDownButton.click()
    
    // Verify the confirmation dialog was shown
    expect(dialogMessage).toContain('Merge the issue below into this issue?')
  })

  test('clicking merge up button should trigger confirmation dialog', async ({ page, issuesTable }) => {
    const rows = await issuesTable.getAllRows()
    expect(rows.length).toBeGreaterThanOrEqual(2)
    
    const secondRow = rows[1]
    await secondRow.descriptionCell.hover()
    
    // Set up dialog handler to capture the confirmation
    let dialogMessage = ''
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message()
      await dialog.dismiss()
    })
    
    // Click the merge up button
    await secondRow.mergeUpButton.click()
    
    // Verify the confirmation dialog was shown
    expect(dialogMessage).toContain('Merge this issue into the issue above?')
  })

  test('unmerge button should be visible for merged AIA issues and trigger confirmation', async ({ page, issuesTable }) => {
    const rows = await issuesTable.getAllRows()
    
    // If there are 2+ rows, we need to merge first
    // If there's 1 row with unmerge visible, it's already merged from a previous test
    const firstRow = rows[0]
    await firstRow.descriptionCell.hover()
    
    let dialogMessages: string[] = []
    
    // Check if unmerge is already visible (already merged state)
    const unmergeVisible = await firstRow.unmergeButton.isVisible()
    
    if (!unmergeVisible && rows.length >= 2) {
      // Need to merge first
      page.once('dialog', async dialog => {
        dialogMessages.push(dialog.message())
        await dialog.accept()
      })
      await firstRow.mergeDownButton.click()
      await page.waitForLoadState('networkidle')
      
      // Get the updated rows
      const updatedRows = await issuesTable.getAllRows()
      const mergedRow = updatedRows[0]
      await mergedRow.descriptionCell.hover()
      
      // Unmerge button should now be visible
      await expect(mergedRow.unmergeButton).toBeVisible()
      await expect(mergedRow.unmergeButton).toHaveAttribute('aria-label', 'Unmerge issue')
      
      // Click unmerge and verify confirmation
      dialogMessages = []
      page.once('dialog', async dialog => {
        dialogMessages.push(dialog.message())
        await dialog.accept()
      })
      await mergedRow.unmergeButton.click()
      expect(dialogMessages.length).toBe(1)
      expect(dialogMessages[0]).toContain('Unmerge')
    } else {
      // Already merged, just test unmerge
      await expect(firstRow.unmergeButton).toBeVisible()
      await expect(firstRow.unmergeButton).toHaveAttribute('aria-label', 'Unmerge issue')
      
      // Click unmerge and verify confirmation
      page.once('dialog', async dialog => {
        dialogMessages.push(dialog.message())
        await dialog.accept()
      })
      await firstRow.unmergeButton.click()
      expect(dialogMessages.length).toBe(1)
      expect(dialogMessages[0]).toContain('Unmerge')
    }
  })

  test('unmerge button has correct icon and attributes', async ({ page, issuesTable }) => {
    // Check if unmerge is visible (merged state) or we need to merge first
    const rows = await issuesTable.getAllRows()
    const firstRow = rows[0]
    await firstRow.descriptionCell.hover()
    
    let unmergeVisible = await firstRow.unmergeButton.isVisible()
    
    if (!unmergeVisible && rows.length >= 2) {
      // Set up dialog handler for THIS specific click
      page.once('dialog', async dialog => {
        await dialog.accept()
      })

      // Merge first to get unmerge button visible
      await firstRow.mergeDownButton.click()
      await page.waitForLoadState('networkidle')
      // Small delay to ensure DOM is updated
      await page.waitForTimeout(500)
      
      const updatedRows = await issuesTable.getAllRows()
      const mergedRow = updatedRows[0]
      await mergedRow.descriptionCell.hover()
      unmergeVisible = await mergedRow.unmergeButton.isVisible()
      
      if (unmergeVisible) {
        // Check the unmerge button has correct attributes
        await expect(mergedRow.unmergeButton).toHaveAttribute('aria-label', 'Unmerge issue')
        await expect(mergedRow.unmergeButton).toHaveAttribute('title', 'Unmerge issue')
        
        // Check for img icon inside the button (implementation uses img)
        const img = mergedRow.unmergeButton.locator('img')
        await expect(img).toBeVisible()
        await expect(img).toHaveAttribute('src', '/icons/split-turn-down-right-svgrepo-com.svg')
      }
    } else if (unmergeVisible) {
      // Already merged, check attributes
      await expect(firstRow.unmergeButton).toHaveAttribute('aria-label', 'Unmerge issue')
      await expect(firstRow.unmergeButton).toHaveAttribute('title', 'Unmerge issue')
      
      // Check for img icon inside the button (implementation uses img)
      const img = firstRow.unmergeButton.locator('img')
      await expect(img).toBeVisible()
      await expect(img).toHaveAttribute('src', '/icons/split-turn-down-right-svgrepo-com.svg')
    }
  })
})
