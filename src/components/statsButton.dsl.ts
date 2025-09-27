import { test as base, Page } from "@playwright/test"

class StatsButtonDSL {
  constructor(private readonly page: Page) {
  }

  navigateTo(url: string = '/') {
    return this.page.goto(url)
  }

  get isVisible() {
    return this.page.isVisible('button[data-testid="stats-button"]')
  }
}

export const test = base.extend<{ statsButton: StatsButtonDSL }>({
  statsButton: async ({ page }, use) => {
    await use(new StatsButtonDSL(page))
  }
})
