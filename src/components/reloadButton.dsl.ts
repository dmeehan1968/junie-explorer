import { test as base, Page } from "@playwright/test"

class ReloadButtonDSL {
  constructor(private readonly page: Page) {
  }

  navigateTo(url: string = '/') {
    return this.page.goto(url)
  }

  get isVisible() {
    return this.page.isVisible('button#reload-button')
  }
}

export const test = base.extend<{ reloadButton: ReloadButtonDSL }>({
  reloadButton: async ({ page }, use) => {
    await use(new ReloadButtonDSL(page))
  }
})
