import { Page, test as base, expect } from '@playwright/test'

export class MessageTrajectoriesSectionDSL {
  constructor(private readonly page: Page) {
  }

  async navigateTo(url: string = "/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories") {
    await this.page.goto(url)
  }

  get title() {
    return this.page.getByRole('heading', { name: 'Message Trajectories' })
  }

  get systemMessage() {
    return this.page.getByTestId('system-message').locator('..')
  }

  get tools() {
    return this.page.getByTestId('user-tools').locator('..')
  }

  get userChatMessages() {
    return this.page.getByTestId('user-chat-message').locator('..')
  }

  get issueDescription() {
    return this.userChatMessages.filter({ hasText: /<\/issue_description>/ })
  }

  get initialUserContext() {
    return this.userChatMessages.filter({ hasText: /## INITIAL USER CONTEXT/ })
  }

  get currentSession() {
    return this.page.locator('#current-session')
  }
}

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