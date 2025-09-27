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

  get screenshot() {
    return this.page.locator('#projects-graph-container')
  }

  get isVisible() {
    return this.page.isVisible('#projects-graph-container')
  }
}

export const test = base.extend<{ projectMetricsChart: ProjectMetricsChartDSL }>({
  projectMetricsChart: async ({ page }, use) => {
    await use(new ProjectMetricsChartDSL(page))
  },
})
