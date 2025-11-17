/** @jsxImportSource @kitajs/html */

import { expect, Page, test as base } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml"
import { EventTimelineSection } from "./eventTimelineSection"
import type { EventRecord } from "../schema/eventRecord"

export { expect } from "@playwright/test"

export interface EventTimelineSectionProps {
  events: EventRecord[]
}

const DefaultProps: EventTimelineSectionProps = {
  events: [],
}

const asRecord = (event: any, timestamp: Date = new Date(0), parseError?: any): EventRecord => ({
  event,
  timestamp: timestamp,
  timestampMs: timestamp,
  ...(parseError ? { parseError } : {}),
} as any)

export class EventTimelineSectionDSL {
  private constructor(private readonly page: Page, private props: EventTimelineSectionProps) {}

  static async create(page: Page, props: Partial<EventTimelineSectionProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <EventTimelineSection {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new EventTimelineSectionDSL(page, merged)
  }

  private async render() {
    const body = await <EventTimelineSection {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<EventTimelineSectionProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  // Builders
  record(event: any, timestamp: Date = new Date(0), parseError?: any) { return asRecord(event, timestamp, parseError) }

  // Convenience setters
  async setEvents(events: EventRecord[]) { await this.setProps({ events }) }

  // Locators
  get container() { return this.page.getByTestId('event-timeline-section') }
  get header() { return this.page.getByTestId('event-timeline-header') }
  get title() { return this.header.locator('h3') }
  get toggleHint() { return this.header.locator('.collapsible-toggle') }
  get content() { return this.page.locator('.collapsible-content') }
  get canvas() { return this.page.locator('#event-timeline-chart') }
}

export const test = base.extend<{ eventTimeline: EventTimelineSectionDSL }>({
  eventTimeline: async ({ page }, use) => {
    await use(await EventTimelineSectionDSL.create(page))
  },
})
