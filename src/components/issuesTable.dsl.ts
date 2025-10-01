import { Page } from "@playwright/test"
import { test as base } from "playwright/test"
import { IssueRowDSL } from "./issueRow.dsl.js"

export class IssuesTableDSL {
  constructor(private readonly page: Page) {
  }

  navigateTo(projectName: string = 'default.999999') {
    return this.page.goto(`/project/${encodeURIComponent(projectName)}`)
  }

  get isVisible() {
    return this.page.isVisible('[data-testid="issues-table"]')
  }

  get table() {
    return this.page.locator('[data-testid="issues-table"]')
  }

  // No issues message
  get noIssuesMessage() {
    return this.page.locator('[data-testid="no-issues-message"]')
  }

  // Header elements
  get issuesCountHeader() {
    return this.page.locator('h3.text-primary')
  }

  get elapsedTimeHeader() {
    return this.page.locator('[data-testid="summary-elapsed-time"]')
  }

  // Compare button
  get compareButton() {
    return this.page.locator('[data-testid="compare-button"]')
  }

  async isCompareButtonEnabled(): Promise<boolean> {
    return !(await this.compareButton.isDisabled())
  }

  // Select all checkbox
  get selectAllCheckbox() {
    return this.page.locator('#selectAllIssues')
  }

  async hasSelectAllCheckbox(): Promise<boolean> {
    return (await this.selectAllCheckbox.count()) > 0
  }

  // Column headers
  get descriptionColumnHeader() {
    return this.table.locator('thead th', { hasText: /Issue Description/ })
  }

  get timestampColumnHeader() {
    return this.table.locator('thead th', { hasText: /Timestamp/ })
  }

  get inputTokensColumnHeader() {
    return this.table.locator('thead th', { hasText: /Input Tokens/ })
  }

  get outputTokensColumnHeader() {
    return this.table.locator('thead th', { hasText: /Output Tokens/ })
  }

  get cacheTokensColumnHeader() {
    return this.table.locator('thead th', { hasText: /Cache Tokens/ })
  }

  get costColumnHeader() {
    return this.table.locator('thead th', { hasText: /Cost/ })
  }

  get timeColumnHeader() {
    return this.table.locator('thead th', { hasText: /^Time$/ })
  }

  get statusColumnHeader() {
    return this.table.locator('thead th', { hasText: /Status/ })
  }

  get llmColumnHeader() {
    return this.table.locator('thead th', { hasText: /LLM/ })
  }

  // Header summary row (second row in thead)
  get headerSummaryLabel() {
    return this.page.locator('[data-testid="header-summary-label"]')
  }

  get headerSummaryInputTokens() {
    return this.page.locator('[data-testid="header-summary-input-tokens"]')
  }

  get headerSummaryOutputTokens() {
    return this.page.locator('[data-testid="header-summary-output-tokens"]')
  }

  get headerSummaryCacheTokens() {
    return this.page.locator('[data-testid="header-summary-cache-tokens"]')
  }

  get headerSummaryCost() {
    return this.page.locator('[data-testid="header-summary-cost"]')
  }

  get headerSummaryTotalTime() {
    return this.page.locator('[data-testid="header-summary-total-time"]')
  }

  // Footer summary row
  get footerSummaryLabel() {
    return this.page.locator('[data-testid="summary-label"]')
  }

  get footerSummaryInputTokens() {
    return this.page.locator('[data-testid="summary-input-tokens"]')
  }

  get footerSummaryOutputTokens() {
    return this.page.locator('[data-testid="summary-output-tokens"]')
  }

  get footerSummaryCacheTokens() {
    return this.page.locator('[data-testid="summary-cache-tokens"]')
  }

  get footerSummaryCost() {
    return this.page.locator('[data-testid="summary-cost"]')
  }

  get footerSummaryTotalTime() {
    return this.page.locator('[data-testid="summary-total-time"]')
  }

  // No metrics warning message
  get noMetricsWarning() {
    return this.page.locator('.bg-base-content\\/10', { hasText: /does not contain token or cost metrics/ })
  }

  async hasNoMetricsWarning(): Promise<boolean> {
    return this.noMetricsWarning.isVisible()
  }

  // Row operations
  async getAllRows(): Promise<IssueRowDSL[]> {
    const rowsLocator = this.table.locator('tbody tr')
    const count = await rowsLocator.count()
    return Array.from({ length: count }, (_, i) => new IssueRowDSL(rowsLocator.nth(i)))
  }

  // Compare modal
  get compareModal() {
    return this.page.locator('#compareModal')
  }

}

export const test = base.extend<{ issuesTable: IssuesTableDSL }>({
  issuesTable: async ({ page }, use) => {
    await use(new IssuesTableDSL(page))
  }
})
