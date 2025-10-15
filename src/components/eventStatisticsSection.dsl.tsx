/** @jsxImportSource @kitajs/html */

import { expect, Page, test as base } from "@playwright/test"
import { escapeHtml } from "../utils/escapeHtml.js"
import { wrapHtml } from "../utils/wrapHtml.js"
import { EventStatisticsSection, EventStatisticsSectionProps } from "./eventStatisticsSection.js"

export { expect } from "@playwright/test"

const DefaultProps: EventStatisticsSectionProps = {
  events: [],
  task: { eventTypes: Promise.resolve([]) },
}

export class EventStatisticsSectionDSL {
  private constructor(private readonly page: Page, private props: EventStatisticsSectionProps) {}

  static async create(page: Page, props: Partial<EventStatisticsSectionProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await (EventStatisticsSection as any)(merged)
    await page.setContent(wrapHtml(body ?? ''))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new EventStatisticsSectionDSL(page, merged)
  }

  private async render() {
    const body = await (EventStatisticsSection as any)(this.props)
    await this.page.setContent(wrapHtml(body ?? ''))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<EventStatisticsSectionProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  async setEvents(events: any[]) {
    await this.setProps({ events })
  }

  async setTaskEventTypes(eventTypes: string[]) {
    // support both sync and async shapes
    await this.setProps({ task: { eventTypes: Promise.resolve(eventTypes) } as any })
  }

  // Locators
  get container() {
    return this.page.getByTestId('event-statistics-section')
  }

  get header() {
    return this.page.getByTestId('event-statistics-header')
  }

  get title() {
    return this.header.locator('h3')
  }

  get toggleHint() {
    return this.header.locator('.collapsible-toggle')
  }

  get content() {
    return this.page.locator('.collapsible-content')
  }

  get table() {
    return this.page.getByTestId('event-stats-table')
  }

  rowByEventType(type: string) {
    const id = escapeHtml(type)
    return this.page.getByTestId(`event-stats-row-${id}`)
  }

  // Convenience to get the 5 cells (type, count, min, max, avg)
  async rowCells(type: string) {
    const row = this.rowByEventType(type)
    return row.locator('td')
  }
}

export const test = base.extend<{ eventStats: EventStatisticsSectionDSL }>({
  eventStats: async ({ page }, use) => {
    await use(await EventStatisticsSectionDSL.create(page))
  },
})
