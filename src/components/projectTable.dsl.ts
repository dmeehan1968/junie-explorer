import { Page } from "@playwright/test"

export class ProjectTableDSL {

  constructor(private readonly page: Page, private readonly baseUrl: string) {
  }

  async navigateTo(url: string = '/'): Promise<void> {
    const target = new URL(url, this.baseUrl).toString()
    await this.page.goto(target)
  }

  async search(text: string): Promise<void> {
    await this.page.fill('input[data-testid="project-search"]', text)
    await this.page.waitForFunction(async (text) => {
      const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('#projects-table tbody tr'))
      return rows.length > 0 && rows.every(row => {
        const projectName = row.querySelector('[data-testid="project-name"]')
        return row.style.display !== 'none' && projectName?.textContent?.toLowerCase().includes(text.toLowerCase())
      })
    }, text)
  }

  async selectRow(index: number): Promise<void> {
    await this.page.locator(`#projects-table tbody tr:nth-child(${index})`)
      .nth(index - 1)
      .locator('input.project-checkbox')
      .click()
  }

  get exists() {
    return this.page.isVisible('#projects-table')
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
}