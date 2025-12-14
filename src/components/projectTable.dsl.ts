import { Locator, Page, test as base } from "@playwright/test"
import { ProjectRowDSL } from "./projectRow.dsl"

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

  async selectRow(indexOrId: number | string): Promise<void> {
    if (typeof indexOrId === 'number') {
      await this.page
        .locator(`#projects-table tbody tr:nth-child(${indexOrId}) input.project-checkbox`)
        .click()
    } else {
      await this.page.locator(`#projects-table tbody tr input.project-checkbox[data-project-name="${indexOrId}"]`).click()
    }
  }

  get visibleRowCount() {
    return this.page.locator('#projects-table tbody tr >> visible=true').count()
  }

  get totalRowCount() {
    return this.page.locator('#projects-table tbody tr').count()
  }

  get selectAllButton() {
    return this.page.getByRole('checkbox', { name: 'Select All' })
  }

  get nameColumn() {
    return this.page.locator('#projects-table thead th:nth-child(2)', { hasText: /Name/ })
  }

  get searchInput() {
    return this.page.getByTestId('project-search')
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

  get noMatchingProjects(): Locator {
    return this.page.getByTestId('no-matching-projects')
  }

  async getAllRows(): Promise<ProjectRowDSL[]> {
    const rowsLocator = this.page.locator('#projects-table tbody tr.project-row')
    const count = await rowsLocator.count()
    return Array.from({ length: count }, (_, i) => new ProjectRowDSL(rowsLocator.nth(i)))
  }

  async getRowForProject(projectName: string): Promise<ProjectRowDSL | undefined> {
    const row = this.page.locator(`#projects-table tbody tr.project-row:has([data-project-name="${projectName}"])`).nth(0)
    return new ProjectRowDSL(row)
  }
}

export const test = base.extend<{ projectTable: ProjectTableDSL }>({
  projectTable: async ({ page }, use) => {
    await use(new ProjectTableDSL(page))
  },
})

