/** @jsxImportSource @kitajs/html */

import { expect, Page, test as base } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml"
import { EventMetricsSection } from "./eventMetricsSection"

export { expect } from "@playwright/test"

export interface EventMetricsSectionProps {
  hasMetrics: boolean
}

const DefaultProps: EventMetricsSectionProps = {
  hasMetrics: false,
}

export class EventMetricsSectionDSL {
  private constructor(private readonly page: Page, private props: EventMetricsSectionProps) {}

  static async create(page: Page, props: Partial<EventMetricsSectionProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <EventMetricsSection {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new EventMetricsSectionDSL(page, merged)
  }

  private async render() {
    const body = await <EventMetricsSection {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<EventMetricsSectionProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  async setHasMetrics(hasMetrics: boolean) {
    await this.setProps({ hasMetrics })
  }

  // Locators
  get container() {
    return this.page.getByTestId('event-metrics-section')
  }

  get header() {
    return this.page.getByTestId('event-metrics-header')
  }

  get title() {
    return this.header.locator('h3')
  }

  get toggleHint() {
    return this.header.locator('.collapsible-toggle')
  }

  get providerFilters() {
    return this.page.getByTestId('llm-provider-filters')
  }

  get canvas() {
    return this.page.locator('#llmMetricsChart')
  }
}

export const test = base.extend<{ eventMetrics: EventMetricsSectionDSL }>({
  eventMetrics: async ({ page }, use) => {
    await use(await EventMetricsSectionDSL.create(page))
  },
})
