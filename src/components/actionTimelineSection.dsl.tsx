/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml.js"
import { ActionTimelineSection } from "./actionTimelineSection.js"

export type ActionTimelineProps = {
  hasActionEvents: boolean
  actionCount: number
}

const DefaultProps: ActionTimelineProps = {
  hasActionEvents: true,
  actionCount: 0,
}

export class ActionTimelineDSL {
  private constructor(private readonly page: Page, private props: ActionTimelineProps) {}

  static async create(page: Page, props: Partial<ActionTimelineProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <ActionTimelineSection {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new ActionTimelineDSL(page, merged)
  }

  private async render() {
    const body = await <ActionTimelineSection {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<ActionTimelineProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  // Convenience setters
  async setHasActionEvents(v: boolean) { await this.setProps({ hasActionEvents: v }) }
  async setActionCount(n: number) { await this.setProps({ actionCount: n }) }

  // Locators
  get section() { return this.page.getByTestId('action-timeline-section') }
  get header() { return this.page.getByTestId('action-timeline-header') }
  get title() { return this.header.locator('h3') }
  get toggleLabel() { return this.header.locator('.collapsible-toggle') }
  get canvas() { return this.page.locator('#action-timeline-chart') }
}

export const test = base.extend<{ actionTimeline: ActionTimelineDSL }>({
  actionTimeline: async ({ page }, use) => {
    await use(await ActionTimelineDSL.create(page))
  }
})
