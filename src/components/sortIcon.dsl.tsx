/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml"
import { SortIcon, SortDirection } from "./sortIcon"

export type SortIconProps = {
  direction: SortDirection
}

const DefaultProps: SortIconProps = {
  direction: 'asc'
}

export class SortIconDSL {
  private constructor(private readonly page: Page, private props: SortIconProps) {}

  static async create(page: Page, props: Partial<SortIconProps> = {}) {
    const merged: SortIconProps = { ...DefaultProps, ...props }
    const body = await <SortIcon {...merged} />
    await page.setContent(wrapHtml(body))
    try { await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' }) } catch {}
    return new SortIconDSL(page, merged)
  }

  private async render() {
    const body = await <SortIcon {...this.props} />
    await this.page.setContent(wrapHtml(body))
    try { await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' }) } catch {}
  }

  async setProps(props: Partial<SortIconProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  async setDirection(direction: SortDirection) { await this.setProps({ direction }) }

  // Locators
  get svg() { return this.page.locator('svg') }
  get rects() { return this.page.locator('svg rect') }
  get polygon() { return this.page.locator('svg polygon') }

  // Attribute helpers
  get width() { return this.svg.getAttribute('width') }
  get height() { return this.svg.getAttribute('height') }
  get viewBox() { return this.svg.getAttribute('viewBox') }
  get ariaHidden() { return this.svg.getAttribute('aria-hidden') }

  async rectAttr(i: number, name: string) {
    return this.rects.nth(i).getAttribute(name)
  }

  async polygonPoints() {
    return this.polygon.getAttribute('points')
  }
}

export const test = base.extend<{ sortIcon: SortIconDSL }>({
  sortIcon: async ({ page }, use) => {
    await use(await SortIconDSL.create(page))
  }
})
