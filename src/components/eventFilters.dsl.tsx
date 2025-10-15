/** @jsxImportSource @kitajs/html */

import { expect, Page, test as base } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml.js"
import { EventFilters, EventFiltersProps } from "./eventFilters.js"

export { expect } from "@playwright/test"

const DefaultProps: EventFiltersProps = {
  eventTypes: [],
}

export class EventFiltersDSL {
  private constructor(private readonly page: Page, private props: EventFiltersProps) {
  }

  static async create(page: Page, props: Partial<EventFiltersProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <EventFilters {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new EventFiltersDSL(page, merged)
  }

  private async render() {
    const body = await <EventFilters {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<EventFiltersProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  // Convenience setters
  async setEventTypes(types: string[]) {
    await this.setProps({ eventTypes: types })
  }

  // Locators
  get container() {
    return this.page.locator('.mb-5 .flex.flex-wrap')
  }

  get allNoneToggle() {
    return this.page.getByTestId('all-none-toggle')
  }

  filterByTypeId(id: string) {
    return this.page.getByTestId(`event-filter-${id}`)
  }

  filterChips() {
    return this.page.locator('.event-filter:not(.all-none-toggle)')
  }
}

export const test = base.extend<{ eventFilters: EventFiltersDSL }>({
  eventFilters: async ({ page }, use) => {
    await use(await EventFiltersDSL.create(page))
  },
})
