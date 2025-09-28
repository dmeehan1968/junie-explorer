import { Page } from "@playwright/test"
import { test as base } from "playwright/test"
import { ProjectRowDSL } from "./projectRow.dsl.js"

export class ProjectTableDSL {
  constructor(private readonly page: Page) {
  }

  navigateTo(url: string = '/') {
    return this.page.goto(url)
  }

  get isVisible() {
    return this.page.isVisible('#projects-table')
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text)
    await this.page.waitForFunction(async (text) => {
      const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('#projects-table tbody tr'))
      return rows.length > 0 && rows.every(row => {
        const projectName = row.querySelector('[data-testid="project-name"]')
        return row.style.display !== 'none' && projectName?.textContent?.toLowerCase().includes(text.toLowerCase())
      })
    }, text)
  }

  async selectRow(index: number): Promise<void> {
    await this.page
      .locator(`#projects-table tbody tr:nth-child(${index}) input.project-checkbox`)
      .click()
  }

  get rowCount() {
    return this.page.$$eval('#projects-table tbody tr', rows => rows.length)
  }

  get selectedRowCount() {
    const selector = '#projects-table tbody tr input.project-checkbox:checked'
    return this.page.waitForSelector(selector).then(() => this.page.locator(selector).count())
  }

  get visibleRowCount() {
    return this.page.$$eval('#projects-table tbody tr >> visible=true', rows => rows.length)
  }

  get selectAllButton() {
    return this.page.getByRole('checkbox', { name: 'Select All' })
  }

  get nameColumn() {
    return this.page.locator('#projects-table thead th:nth-child(2)', { hasText: /Name/ })
  }

  get searchInput() {
    return this.page.locator('input[data-testid="project-search"]')
  }

  get lastUpdatedColumn() {
    return this.page.locator('#projects-table thead th', { hasText: /Last Updated/ })
  }

  get issueCountColumn() {
    return this.page.locator('#projects-table thead th', { hasText: /Issues/ })
  }

  get llmIconColumn() {
    return this.page.locator('#projects-table thead th', { hasText: /LLM/ })
  }

  get ideIconColumn() {
    return this.page.locator('#projects-table thead th', { hasText: /IDEs/ })
  }

  async projectRowCount(): Promise<number> {
    return this.page.locator('#projects-table tbody tr.project-row').count()
  }

  async getRowAt(index: number): Promise<ProjectRowDSL> {
    const rowLocator = this.page.locator('#projects-table tbody tr.project-row').nth(index)
    return new ProjectRowDSL(rowLocator)
  }

  async getAllRows(): Promise<ProjectRowDSL[]> {
    const rowsLocator = this.page.locator('#projects-table tbody tr.project-row')
    const count = await rowsLocator.count()
    return Array.from({ length: count }, (_, i) => new ProjectRowDSL(rowsLocator.nth(i)))
  }
}

export const test = base.extend<{ projectTable: ProjectTableDSL }>({
  projectTable: async ({ page }, use) => {
    await use(new ProjectTableDSL(page))
  }
})

