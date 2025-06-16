import { Page } from "@playwright/test"

export class ReloadButton {

  private readonly selector = '[data-testid="reload-button"]' as const

  constructor(private readonly page: Page) {
  }

  async isVisible(): Promise<boolean> {
    return await this.page.isVisible(this.selector)
  }

  async click(): Promise<void> {
    await this.page.click(this.selector)
  }

  async isLoading(): Promise<boolean> {
    const reloadButton = this.page.locator(this.selector)
    const cls = await reloadButton.getAttribute('class')
    return cls?.includes('loading') ?? false
  }
}