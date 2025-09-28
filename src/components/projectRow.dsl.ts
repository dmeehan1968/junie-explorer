import { Locator } from "@playwright/test"

export class ProjectRowDSL {
  constructor(private readonly row: Locator) {
  }

  get element() {
    return this.row
  }

  locator(selectorOrLocator: string | Locator): Locator {
    return this.row.locator(selectorOrLocator)
  }

  // The name cell contains the project name and should navigate to the project route
  get nameCell() {
    return this.locator('td:has([data-testid="project-name"])')
  }

  get nameEl() {
    return this.locator('[data-testid="project-name"]')
  }

  // Optional anchor inside the name cell
  get projectAnchor() {
    return this.nameCell.locator('a')
  }

  async hasAnchor(): Promise<boolean> {
    return (await this.projectAnchor.count()) > 0
  }

  get checkbox() {
    return this.locator('input.project-checkbox')
  }

  get updatedCell() {
    return this.locator('td[data-updated-ts]')
  }

  get llmCell() {
    return this.locator('td[data-updated-ts] + td + td')
  }

  get llmIcons() {
    return this.llmCell.locator('[role="img"]')
  }

  get ideIcons() {
    return this.locator('[data-testid="ide-icons"] img')
  }

  async getNameText(): Promise<string> {
    const txt = await this.nameEl.textContent()
    return (txt || '').trim()
  }

  async hasCheckbox(): Promise<boolean> {
    return (await this.checkbox.count()) > 0
  }

  async getIssuesText(): Promise<string> {
    const txt = await this.row.locator('td[data-updated-ts] + td span').textContent()
    return (txt || '').trim()
  }

  async getNameCellOnclick(): Promise<string | null> {
    return this.nameCell.getAttribute('onclick')
  }
}