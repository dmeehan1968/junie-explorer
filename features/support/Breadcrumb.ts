import { Page } from "@playwright/test"

export class Breadcrumb {

  constructor(private readonly page: Page) {
  }

  isVisible(): Promise<boolean> {
    return this.page.isVisible('[data-testid="breadcrumb-navigation"]')
  }

  click(link: string): Promise<void> {
    return this.page.click(`[data-testid="breadcrumb-${link.split(' ').map(part => part.trim().toLowerCase()).join('-')}"]`)
  }

  url(): string {
    return this.page.url()
  }
}