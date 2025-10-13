/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml.js"
import { ModelPerformanceSection } from "./modelPerformanceSection.js"

export type ModelPerformanceProps = {
  hasMetrics: boolean
}

const DefaultProps: ModelPerformanceProps = {
  hasMetrics: false,
}

export class ModelPerformanceDSL {
  private constructor(private readonly page: Page, private props: ModelPerformanceProps) {}

  static async create(page: Page, props: Partial<ModelPerformanceProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <ModelPerformanceSection {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new ModelPerformanceDSL(page, merged)
  }

  private async render() {
    const body = await <ModelPerformanceSection {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<ModelPerformanceProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  // Convenience setters
  async setHasMetrics(v: boolean) { await this.setProps({ hasMetrics: v }) }

  // Locators
  get section() { return this.page.getByTestId('model-performance-section') }
  get header() { return this.page.getByTestId('model-performance-header') }
  get title() { return this.header.locator('h3') }
  get toggleLabel() { return this.header.locator('.collapsible-toggle') }
  get content() { return this.page.locator('.collapsible-content') }
  get providerFilters() { return this.page.locator('#model-performance-provider-filters') }
  get metricToggle() { return this.page.locator('#model-performance-metric-toggle') }
  get bothButton() { return this.page.locator('#model-performance-metric-toggle button[data-metric="both"]') }
  get latencyButton() { return this.page.locator('#model-performance-metric-toggle button[data-metric="latency"]') }
  get tpsButton() { return this.page.locator('#model-performance-metric-toggle button[data-metric="tps"]') }
  get canvas() { return this.page.locator('#model-performance-chart') }
}

export const test = base.extend<{ modelPerformance: ModelPerformanceDSL }>({
  modelPerformance: async ({ page }, use) => {
    await use(await ModelPerformanceDSL.create(page))
  }
})
