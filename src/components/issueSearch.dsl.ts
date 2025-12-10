/** @jsxImportSource @kitajs/html */

import { Page, test as base } from "@playwright/test"

export class IssueSearchDSL {
  constructor(private readonly page: Page) {}

  navigateTo(projectName: string = 'default.999999') {
    return this.page.goto(`/project/${encodeURIComponent(projectName)}`)
  }

  get searchContainer() {
    return this.page.locator('[data-testid="issue-search"]')
  }

  get searchInput() {
    return this.page.locator('[data-testid="issue-search-input"]')
  }

  get clearButton() {
    return this.page.locator('[data-testid="clear-search-btn"]')
  }

  get resultCount() {
    return this.page.locator('[data-testid="search-result-count"]')
  }

  get loadingSpinner() {
    return this.page.locator('[data-testid="search-loading"]')
  }

  get highlightedRows() {
    return this.page.locator('tr.issue-row-highlight')
  }

  get allIssueRows() {
    return this.page.locator('tr[data-issue-id]')
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.searchInput.press('Enter')
  }

  async clearSearch() {
    await this.clearButton.click()
  }

  async waitForSearchComplete() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 60000 })
  }
}

export const test = base.extend<{ issueSearch: IssueSearchDSL }>({
  issueSearch: async ({ page }, use) => {
    await use(new IssueSearchDSL(page))
  }
})
