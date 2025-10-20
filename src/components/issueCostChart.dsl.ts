import { Page, test as base } from "@playwright/test"

class IssueCostChartDsl {
  constructor(private readonly page: Page) {
  }

  navigateTo(projectId: string = 'default.999999') {
    return this.page.goto(`/project/${projectId}`)
  }

  get element() {
    return this.page.getByTestId('cost-over-time-graph')
  }
}

export const test = base.extend<{ costChart: IssueCostChartDsl }>({
  costChart: async ({ page }, use) => {
    await use(new IssueCostChartDsl(page))
  }
})
