/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml"
import { StatusBadge } from "./statusBadge"

export type StatusBadgeProps = {
  state: string
}

const DefaultProps: StatusBadgeProps = {
  state: 'new',
}

export class StatusBadgeDSL {
  private constructor(private readonly page: Page, private props: StatusBadgeProps) {}

  static async create(page: Page, props: Partial<StatusBadgeProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <StatusBadge {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new StatusBadgeDSL(page, merged)
  }

  private async render() {
    const body = await <StatusBadge {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<StatusBadgeProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  async setState(state: string) { await this.setProps({ state }) }

  // Locators
  get badge() { return this.page.locator('span') }
  get text() { return this.badge }
  classAttr() { return this.badge.getAttribute('class') }
}

export const test = base.extend<{ statusBadge: StatusBadgeDSL }>({
  statusBadge: async ({ page }, use) => {
    await use(await StatusBadgeDSL.create(page))
  }
})
