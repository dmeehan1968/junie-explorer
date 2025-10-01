import { Page, Locator, expect } from "@playwright/test"
import { test as base } from "./projectTable.dsl.js"
import { ProjectTableDSL } from "./projectTable.dsl.js"

export class IdeSelectionDSL {
  private readonly projectTable: ProjectTableDSL
  constructor(private readonly page: Page) {
    this.projectTable = new ProjectTableDSL(page)
  }

  navigateTo(url: string = "/") {
    return this.page.goto(url)
  }

  // Toolbar container
  get toolbar(): Locator {
    return this.page.getByTestId('ide-filter-toolbar')
  }

  // All IDE filter buttons
  get allIdeButtons(): Locator {
    return this.page.getByTestId('ide-filter')
  }

  // Button for a specific IDE (by its name attribute)
  ideButton(name: string): Locator {
    return this.allIdeButtons.filter({ has: this.page.locator(`:scope[data-ide="${name}"]`) })
  }

  // Determine if a button is currently enabled (selected)
  async isIdeEnabled(name: string): Promise<boolean> {
    const cls = await this.ideButton(name).getAttribute('class')
    // Disabled buttons have opacity-50 and grayscale classes
    return !(cls && /opacity-50|grayscale/.test(cls))
  }

  // Click a specific IDE button
  async toggleIde(name: string) {
    await this.ideButton(name).click()
  }

  // Enable a specific IDE (if currently disabled)
  async enableIde(name: string) {
    if (!(await this.isIdeEnabled(name))) {
      await this.toggleIde(name)
    }
  }

  // Disable a specific IDE (if currently enabled)
  async disableIde(name: string) {
    if (await this.isIdeEnabled(name)) {
      await this.toggleIde(name)
    }
  }

  // Enable only the specified IDE; disable all others
  async enableOnlyIde(target: string) {
    const count = await this.allIdeButtons.count()
    for (let i = 0; i < count; i++) {
      const btn = this.allIdeButtons.nth(i)
      const ide = await btn.getAttribute('data-ide')
      if (!ide) continue
      if (ide === target) {
        await this.enableIde(ide)
      } else {
        await this.disableIde(ide)
      }
    }
  }

  // Enable all IDEs
  async enableAllIdes() {
    const count = await this.allIdeButtons.count()
    for (let i = 0; i < count; i++) {
      const btn = this.allIdeButtons.nth(i)
      const ide = await btn.getAttribute('data-ide')
      if (!ide) continue
      await this.enableIde(ide)
    }
  }

  // Get list of IDE names present in the toolbar
  async listIdeNames(): Promise<string[]> {
    const count = await this.allIdeButtons.count()
    const names: string[] = []
    for (let i = 0; i < count; i++) {
      const ide = await this.allIdeButtons.nth(i).getAttribute('data-ide')
      if (ide) names.push(ide)
    }
    return names
  }

  // Utility: count visible project rows in table (delegated to ProjectTableDSL)
  get visibleProjectRowCount() {
    return this.projectTable.visibleRowCount
  }

  // Utility: total project rows (regardless of visibility) (delegated to ProjectTableDSL)
  get totalProjectRowCount() {
    return this.projectTable.totalRowCount
  }

  get noMatchingProjects() {
    return this.projectTable.noMatchingProjects
  }

  // Convenience: wait until all visible rows include any of the given IDEs
  async waitUntilRowsIncludeAnyIdes(ides: string[]) {
    await this.page.waitForFunction((idesArr) => {
      const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('#projects-table tbody tr'))
      const visibleRows = rows.filter(r => (r as HTMLElement).offsetParent !== null)
      if (visibleRows.length === 0) return false
      return visibleRows.every(r => {
        const ides = JSON.parse(r.getAttribute('data-ides') || '[]') as string[]
        return ides.some(i => idesArr.includes(i))
      })
    }, ides)
  }
}

export const test = base.extend<{ ideSelection: IdeSelectionDSL }>({
  ideSelection: async ({ page }, use) => {
    await use(new IdeSelectionDSL(page))
  }
})
