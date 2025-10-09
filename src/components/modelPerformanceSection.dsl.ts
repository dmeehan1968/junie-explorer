import { Page, Locator } from "@playwright/test"
import { test as base } from "playwright/test"

export class ModelPerformanceDSL {
  constructor(private readonly page: Page) {}

  // Default route provided by the issue description
  navigateTo(url: string = "/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories") {
    return this.page.goto(url)
  }

  // Section root
  get section(): Locator {
    return this.page.getByTestId('model-performance-section')
  }

  // Header and toggle
  get header(): Locator {
    return this.page.getByTestId('model-performance-header')
  }

  get toggleText(): Locator {
    return this.header.locator('.collapsible-toggle')
  }

  // Collapsible content and canvas
  get content(): Locator {
    return this.section.locator('.collapsible-content')
  }

  get canvas(): Locator {
    return this.section.locator('#model-performance-chart')
  }

  // Metric toggle buttons (may be absent except latency when hasMetrics=false)
  get metricToggleContainer(): Locator {
    return this.page.locator('#model-performance-metric-toggle')
  }

  get metricButtons(): Locator {
    return this.metricToggleContainer.locator('button[data-metric]')
  }

  // Provider buttons
  get providerButtons(): Locator {
    return this.page.locator('#model-performance-provider-filters button')
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
      const section = document.querySelector('[data-testid="model-performance-section"]')
      return section?.classList.contains('collapsed')
    })
  }

  async waitForChartReady() {
    // Wait for section expanded and canvas visible
    await this.page.waitForFunction(() => {
      const section = document.querySelector('[data-testid="model-performance-section"]')
      const content = section?.querySelector('.collapsible-content') as HTMLElement | null
      const canvas = section?.querySelector('#model-performance-chart') as HTMLCanvasElement | null
      const expanded = section && !section.classList.contains('collapsed')
      const visible = content && !content.classList.contains('hidden') && canvas
      return Boolean(expanded && visible)
    })

    // Wait until provider filter buttons are created by the client script (means data fetched)
    await this.page.waitForFunction(() => {
      const filters = document.querySelectorAll('#model-performance-provider-filters button')
      return filters.length > 0
    }, null, { timeout: 5000 })
  }

  async selectMetric(metric: 'both'|'latency'|'tps') {
    const button = this.metricToggleContainer.locator(`button[data-metric="${metric}"]`)
    if (await button.count()) {
      await button.click()
      await this.page.waitForTimeout(50)
    }
  }

  async selectProviderByLabel(label: string) {
    const button = this.page.locator('#model-performance-provider-filters button', { hasText: label })
    await button.click()
    await this.page.waitForTimeout(50)
  }

  async pause(ms: number) {
    await this.page.waitForTimeout(ms)
  }
}

export const test = base.extend<{ modelPerformance: ModelPerformanceDSL }>({
  modelPerformance: async ({ page }, use) => {
    await use(new ModelPerformanceDSL(page))
  }
})
