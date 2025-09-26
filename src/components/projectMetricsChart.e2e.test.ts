import { Page } from "@playwright/test"
import { beforeEach, describe, expect, it } from "bun:test"
import { testServer } from "../../test.setup.js"
import { ProjectTableDSL } from "./projectTable.dsl.js"

class ProjectMetricsChartDSL {
  projectTable: ProjectTableDSL

  constructor(private readonly page: Page, private readonly baseUrl: string) {
    this.projectTable = new ProjectTableDSL(page, baseUrl)
  }

  async navigateTo(url: string = '/'): Promise<void> {
    await this.page.goto(new URL(url, this.baseUrl).toString())
  }

  get exists(): Promise<boolean> {
    return this.projectTable.selectRow(1)
      .then(() => this.page.waitForSelector('#projects-graph-container'))
      .then(() => this.page.isVisible('#projects-graph-container'))
  }
}

describe('projectMetricsChart', () => {

  let projectMetrics: ProjectMetricsChartDSL

  beforeEach(async () => {
    const { testPage, testServerAddress } = await testServer()
    projectMetrics = new ProjectMetricsChartDSL(testPage, testServerAddress)
    await projectMetrics.navigateTo()
  })

  it('should exist', async () => {
    expect(projectMetrics.exists).resolves.toEqual(true)
  })
})