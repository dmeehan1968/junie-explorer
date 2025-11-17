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
    await expect(messageTrajectories.currentSession).toBeVisible()
    await expect(messageTrajectories.systemMessage).toBeVisible()
    await expect(messageTrajectories.tools).toHaveText(/No tools listed/)
    await expect(messageTrajectories.issueDescription).toBeVisible()
    await expect(messageTrajectories.initialUserContext).toBeVisible()
  })
})