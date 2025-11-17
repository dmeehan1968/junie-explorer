/** @jsxImportSource @kitajs/html */

import { expect, Page, test as base } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml"
import { EventsTable } from "./eventsTable"
import type { EventRecord } from "../schema/eventRecord"

export { expect } from "@playwright/test"

export type EventsTableProps = {
  events: EventRecord[]
}

const DefaultProps: EventsTableProps = {
  events: [],
}

const asRecord = (event: any, timestamp: Date = new Date(0), parseError?: any): EventRecord => ({
  event,
  timestamp: timestamp,
  timestampMs: timestamp,
  ...(parseError ? { parseError } : {}),
} as any)

export class EventsTableDSL {
  private constructor(private readonly page: Page, private props: EventsTableProps) {}

  static async create(page: Page, props: Partial<EventsTableProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <EventsTable {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new EventsTableDSL(page, merged)
  }

  private async render() {
    const body = await <EventsTable {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<EventsTableProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  // Builders
  record(event: any, timestamp: Date = new Date(0), parseError?: any) { return asRecord(event, timestamp, parseError) }

  // Convenience setters
  async setEvents(events: EventRecord[]) { await this.setProps({ events }) }

  // Locators
  get table() { return this.page.getByTestId('events-table') }
  get noEvents() { return this.page.getByTestId('no-events-message') }
  get rows() { return this.page.getByTestId(/event-row-\d+/) }
  row(index: number) { return this.page.getByTestId(`event-row-${index}`) }

  // Cell helpers per row
  timestampCell(index: number) { return this.row(index).locator('td').nth(0) }
  typeCell(index: number) { return this.row(index).locator('td').nth(1) }
  jsonCell(index: number) { return this.row(index).locator('td').nth(2) }
  costCell(index: number) { return this.row(index).locator('td').nth(3) }

  // Footer
  get totalCostCell() { return this.page.locator('tfoot tr td').last() }
}

export const test = base.extend<{ eventsTable: EventsTableDSL }>({
  eventsTable: async ({ page }, use) => {
    await use(await EventsTableDSL.create(page))
  },
})
