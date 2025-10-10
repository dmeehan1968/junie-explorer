import { Locator, Page, test as base } from "@playwright/test"

export class ActionTimelineDSL {
  constructor(private readonly page: Page) {
  }

  // Default to the provided trajectories route
  navigateTo(url: string = "/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories") {
    return this.page.goto(url)
  }

  // Section root
  get section(): Locator {
    return this.page.getByTestId('action-timeline-section')
  }

  // Header and toggle
  get header(): Locator {
    return this.page.getByTestId('action-timeline-header')
  }

  get toggleText(): Locator {
    return this.header.locator('.collapsible-toggle')
  }

  // Collapsible content and canvas
  get content(): Locator {
    return this.section.locator('.collapsible-content')
  }

  get canvas(): Locator {
    return this.section.locator('#action-timeline-chart')
  }

  async expand() {
    // If already visible, do nothing
    if (await this.content.isVisible()) return
    await this.header.click()
    await this.page.waitForTimeout(75) // allow transition
    await this.waitForChartReady()
  }

  async collapse() {
    if (await this.content.isHidden()) return
    await this.header.click()
    await this.page.waitForTimeout(75)
    await this.page.waitForFunction(() => {
      const section = document.querySelector('[data-testid="action-timeline-section"]')
      return section?.classList.contains('collapsed')
    })
  }

  async waitForChartReady() {
    // Wait for section expanded and canvas visible
    await this.page.waitForFunction(() => {
      const section = document.querySelector('[data-testid="action-timeline-section"]')
      const content = section?.querySelector('.collapsible-content') as HTMLElement | null
      const canvas = section?.querySelector('#action-timeline-chart') as HTMLCanvasElement | null
      const expanded = section && !section.classList.contains('collapsed')
      const visible = content && !content.classList.contains('hidden') && canvas
      return Boolean(expanded && visible)
    })

    // Wait for chart instance created by client script
    await this.page.waitForFunction(() => !!(window as any).taskActionChart, null, { timeout: 5000 })
  }

  async pause(ms: number) {
    await this.page.waitForTimeout(ms)
  }
}

export const test = base.extend<{ actionTimeline: ActionTimelineDSL }>({
  actionTimeline: async ({ page }, use) => {
    await use(new ActionTimelineDSL(page))
  },
})
