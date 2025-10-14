import { Page } from "@playwright/test"

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