import { Locator, Page, test as base } from "@playwright/test"

export class BreadcrumbDSL {
  constructor(private readonly page: Page) {}

  navigateTo(url: string = "/") {
    return this.page.goto(url)
  }

  get breadcrumbNavigation(): Locator {
    return this.page.getByTestId('breadcrumb-navigation')
  }

  get allBreadcrumbItems(): Locator {
    return this.breadcrumbNavigation.locator('li')
  }

  breadcrumbItem(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  async getBreadcrumbItemCount(): Promise<number> {
    return await this.allBreadcrumbItems.count()
  }

  async getBreadcrumbItemHref(testId: string): Promise<string | null> {
    const item = this.breadcrumbItem(testId)
    // Check if it's a link or plain text
    return await item.getAttribute('href')
  }

  async isLastItem(testId: string): Promise<boolean> {
    const item = this.breadcrumbItem(testId)
    // Last items don't have href attribute
    const href = await item.getAttribute('href')
    return href === null
  }
}

export const test = base.extend<{ breadcrumb: BreadcrumbDSL }>({
  breadcrumb: async ({ page }, use) => {
    await use(new BreadcrumbDSL(page))
  }
})
