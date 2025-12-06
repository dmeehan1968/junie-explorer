import { expect, test as base } from '@playwright/test'
import { MessageTrajectoriesSectionDSL } from "./messageTrajectoriesSection.dsl"

const test = base.extend<{ messageTrajectories: MessageTrajectoriesSectionDSL }>({
  messageTrajectories: async ({ page }, use) => {
    await use(new MessageTrajectoriesSectionDSL(page))
  }
})

test.describe('messageTrajectoriesSection', () => {

  test('should have expected elements', async ({ messageTrajectories }) => {
    await messageTrajectories.navigateTo()
    await expect(messageTrajectories.title).toContainText(/^Message Trajectories\s+\(Jump to start of current session\)$/)
    await expect(messageTrajectories.title.locator('a')).toHaveAttribute('href', '#current-session')
    await expect(messageTrajectories.showAllDiffsToggle).toBeVisible()
    await expect(messageTrajectories.showAllDiffsCheckbox).not.toBeChecked()
    await expect(messageTrajectories.currentSession).toBeVisible()
    await expect(messageTrajectories.systemMessage).toBeVisible()
    await expect(messageTrajectories.tools).toHaveText(/No tools listed/)
    await expect(messageTrajectories.issueDescription).toBeVisible()
    await expect(messageTrajectories.initialUserContext).toBeVisible()
  })

  test('should toggle show all diffs via query parameter', async ({ messageTrajectories, page }) => {
    await messageTrajectories.navigateTo()
    await expect(messageTrajectories.showAllDiffsCheckbox).not.toBeChecked()

    await messageTrajectories.showAllDiffsCheckbox.click()

    await expect(page).toHaveURL(/showAllDiffs=1/)
    await expect(messageTrajectories.showAllDiffsCheckbox).toBeChecked()
  })
})