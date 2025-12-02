import { Locator, Page, test as base } from "@playwright/test"

export class TaskCardDSL {
  constructor(private readonly page: Page) {
  }

  // Default to the provided trajectories route
  navigateTo(url: string = "/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories") {
    return this.page.goto(url)
  }

  // Root card
  get card(): Locator {
    return this.page.getByTestId('task-item')
  }

  // Header/title
  get title(): Locator {
    return this.card.locator('h3')
  }

  // Meta info
  get idLabel(): Locator {
    return this.page.locator('div', { hasText: /^ID:/ }).first()
  }

  get createdLabel(): Locator {
    return this.page.locator('div', { hasText: /^Created:/ }).first()
  }

  // Description (present per fixture)
  get description(): Locator {
    return this.page.getByTestId('task-description')
  }

  // Metrics table and cells
  get metrics(): Locator {
    return this.page.getByTestId('task-metrics')
  }

  get inputTokensCell(): Locator {
    return this.metrics.locator('td', { hasText: /Input Tokens:/ })
  }

  get outputTokensCell(): Locator {
    return this.metrics.locator('td', { hasText: /Output Tokens:/ })
  }

  get cacheTokensCell(): Locator {
    return this.metrics.locator('td', { hasText: /Cache Tokens:/ })
  }

  get costCell(): Locator {
    return this.metrics.locator('td', { hasText: /Cost:/ })
  }

  get totalTimeCell(): Locator {
    return this.metrics.locator('td', { hasText: /Total Time:/ })
  }

  // Tabs
  get tabGroup(): Locator {
    return this.page.getByTestId('task-tab-group')
  }

  get trajectoriesTab(): Locator {
    return this.tabGroup.locator('input[aria-label="Trajectories"]')
  }

  get eventsTab(): Locator {
    return this.tabGroup.locator('input[aria-label="Events"]')
  }

  get downloadButton(): Locator {
    return this.page.getByTestId('download-btn')
  }
}

export const test = base.extend<{ taskCard: TaskCardDSL }>({
  taskCard: async ({ page }, use) => {
    await use(new TaskCardDSL(page))
  },
})
