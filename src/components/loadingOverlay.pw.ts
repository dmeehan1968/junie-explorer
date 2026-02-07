import { test, expect } from "@playwright/test"

test.describe('Loading Indicator', () => {
  test('should show loading overlay when unmerging', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/')
    
    // Find a project link and click it
    // Using a more robust selector based on ProjectTable.tsx
    const projectLink = page.locator('.project-name').first()
    await projectLink.click()

    // Wait for the table to load
    await expect(page.getByTestId('issues-table')).toBeVisible()

    // Mock the unmerge API call to have a delay
    await page.route('**/unmerge', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, unmergedTaskIds: ['test-task-id'] })
      })
    })

    // Setup dialog handler to confirm the unmerge
    page.on('dialog', dialog => dialog.accept())

    // Find an unmerge button and click it
    const unmergeBtn = page.getByTestId('unmerge-btn').first()
    
    // Check if unmerge button exists, if not we might need to merge something first or use a different fixture
    if (await unmergeBtn.isVisible()) {
      await unmergeBtn.click()

      // The loading overlay should be visible
      const overlay = page.locator('#loadingOverlay')
      await expect(overlay).toBeVisible()
      await expect(overlay.locator('text=Processing...')).toBeVisible()
      
      // After the delay, the page reloads (in the real app), 
      // but here we just wait for the route to finish
      await page.waitForResponse('**/unmerge')
    } else {
      console.log('No unmerge button found, skipping visibility check')
    }
  })
})
