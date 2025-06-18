import { Page } from "@playwright/test"

export class Breadcrumb {

  constructor(private readonly page: Page) {
  }

  isVisible(): Promise<boolean> {
    return this.page.isVisible('[data-testid="breadcrumb-navigation"]')
  }

  click(link: string): Promise<void> {
    const name = link.split(' ').map(part => part.trim().toLowerCase()).join('-')
    return this.page.click(`[data-testid="breadcrumb-${name}"]`)
  }

  url(): string {
    return this.page.url()
  }

  isActive(link: string): Promise<boolean> {
    return this.page.isVisible(`breadcrumb-item active`)
  }
}