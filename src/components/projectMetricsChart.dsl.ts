import { Page } from "@playwright/test"
import { test as base } from "./projectTable.dsl.js"

export class ProjectMetricsChartDSL {
  constructor(private readonly page: Page) {
  }

  navigateTo(url: string = '/') {
    return this.page.goto(url)
  }

  radioButton(name: string) {
    return this.page.getByRole('radio', { name, exact: true })
  }

  get container() {
    return this.page.locator('#project-metrics-chart')
  }

}

export const test = base.extend<{ projectMetricsChart: ProjectMetricsChartDSL }>({
  projectMetricsChart: async ({ page }, use) => {
    await use(new ProjectMetricsChartDSL(page))
  },
})
