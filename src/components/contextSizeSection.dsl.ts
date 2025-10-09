import { Page, Locator } from "@playwright/test"
import { test as base } from "playwright/test"

export class ContextSizeDSL {
  constructor(private readonly page: Page) {}

  // Default route provided by the issue description
  navigateTo(url: string = "/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories") {
    return this.page.goto(url)
  }

  // Section root
  get section(): Locator {
    return this.page.getByTestId('context-size-section')
  }

  // Header and toggle
  get header(): Locator {
    return this.page.getByTestId('context-size-header')
  }

  get toggleText(): Locator {
    return this.header.locator('.collapsible-toggle')
  }

  // Collapsible content and canvas
  get content(): Locator {
    return this.section.locator('.collapsible-content')
  }

  get canvas(): Locator {
    return this.section.locator('#context-size-chart')
  }

  // Provider buttons generated client-side
  get providerButtons(): Locator {
    return this.page.locator('#context-size-provider-filters button')
  }

  // Optional include-all-tasks toggle
  get includeAllTasksToggle(): Locator {
    return this.page.locator('#context-size-all-tasks-toggle')
  }

  async expand() {
    if (await this.content.isVisible()) return
    await this.header.click()
    await this.page.waitForTimeout(75)
    await this.waitForChartReady()
  }

  async collapse() {
    if (await this.content.isHidden()) return
    await this.header.click()
    await this.page.waitForTimeout(75)
    await this.page.waitForFunction(() => {
      const section = document.querySelector('[data-testid="context-size-section"]')
      return section?.classList.contains('collapsed')
    })
  }

  async waitForChartReady() {
    // Wait for section expanded and canvas visible
    await this.page.waitForFunction(() => {
      const section = document.querySelector('[data-testid="context-size-section"]')
      const content = section?.querySelector('.collapsible-content') as HTMLElement | null
      const canvas = section?.querySelector('#context-size-chart') as HTMLCanvasElement | null
      const expanded = section && !section.classList.contains('collapsed')
      const visible = content && !content.classList.contains('hidden') && canvas
      return Boolean(expanded && visible)
    })

    // Wait until provider filter buttons are created by the client script (means data fetched)
    await this.page.waitForFunction(() => {
      const filters = document.querySelectorAll('#context-size-provider-filters button')
      return filters.length > 0
    }, null, { timeout: 5000 })
  }

  async selectProviderByIndex(i: number) {
    const btn = this.providerButtons.nth(i)
    await btn.click()
    await this.page.waitForTimeout(50)
  }

  async selectProviderByLabel(label: string) {
    const button = this.page.locator('#context-size-provider-filters button', { hasText: label })
    await button.click()
    await this.page.waitForTimeout(50)
  }

  async toggleIncludeAllTasks(desired?: boolean) {
    const exists = await this.includeAllTasksToggle.count()
    if (!exists) return false
    if (typeof desired === 'boolean') {
      const checked = await this.includeAllTasksToggle.isChecked()
      if (checked !== desired) {
        await this.includeAllTasksToggle.click()
        await this.page.waitForTimeout(80)
      }
    } else {
      await this.includeAllTasksToggle.click()
      await this.page.waitForTimeout(80)
    }
    return true
  }

  async pause(ms: number) {
    await this.page.waitForTimeout(ms)
  }
}

export const test = base.extend<{ contextSize: ContextSizeDSL }>({
  contextSize: async ({ page }, use) => {
    await use(new ContextSizeDSL(page))
  }
})
