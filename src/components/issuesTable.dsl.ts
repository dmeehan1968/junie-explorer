import { Page, test as base } from "@playwright/test"
import { IssueRowDSL } from "./issueRow.dsl"

export class IssuesTableDSL {
  constructor(private readonly page: Page) {
  }

  navigateToProject(projectName: string) {
    return this.page.goto(`/project/${encodeURIComponent(projectName)}`)
  }

  // Top-level
  get table() {
    return this.page.getByTestId('issues-table')
  }

  get isVisible() {
    return this.table.isVisible()
  }

  get noIssuesMessage() {
    return this.page.getByTestId('no-issues-message')
  }

  get compareButton() {
    return this.page.getByTestId('compare-button')
  }

  get summaryElapsedTime() {
    return this.page.getByTestId('summary-elapsed-time')
  }

  // Header summary (thead second row)
  get headerSummaryLabel() {
    return this.page.getByTestId('header-summary-label')
  }

  get headerSummaryInputTokens() {
    return this.page.getByTestId('header-summary-input-tokens')
  }

  get headerSummaryOutputTokens() {
    return this.page.getByTestId('header-summary-output-tokens')
  }

  get headerSummaryCacheTokens() {
    return this.page.getByTestId('header-summary-cache-tokens')
  }

  get headerSummaryCost() {
    return this.page.getByTestId('header-summary-cost')
  }

  get headerSummaryTotalTime() {
    return this.page.getByTestId('header-summary-total-time')
  }

  // Footer summary (tfoot)
  get footerSummaryLabel() {
    return this.page.getByTestId('summary-label')
  }

  get footerSummaryInputTokens() {
    return this.page.getByTestId('summary-input-tokens')
  }

  get footerSummaryOutputTokens() {
    return this.page.getByTestId('summary-output-tokens')
  }

  get footerSummaryCacheTokens() {
    return this.page.getByTestId('summary-cache-tokens')
  }

  get footerSummaryCost() {
    return this.page.getByTestId('summary-cost')
  }

  get footerSummaryTotalTime() {
    return this.page.getByTestId('summary-total-time')
  }

  async getAllRows(): Promise<IssueRowDSL[]> {
    const rowsLocator = this.page.getByTestId('issues-table').locator('tbody tr')
    const count = await rowsLocator.count()
    return Array.from({ length: count }, (_, i) => new IssueRowDSL(rowsLocator.nth(i)))
  }
}

export const test = base.extend<{ issuesTable: IssuesTableDSL }>({
  issuesTable: async ({ page }, use) => {
    await use(new IssuesTableDSL(page))
  },
})
