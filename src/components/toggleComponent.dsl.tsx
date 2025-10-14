/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml.js"
import { ToggleComponent, ToggleComponentProps } from "./toggleComponent.js"

export type ToggleProps = ToggleComponentProps

const DefaultProps: ToggleProps = {
  expandIcon: <span>+</span>,
  collapseIcon: <span>-</span>,
  testId: 'toggle',
}

export class ToggleDSL {
  private constructor(private readonly page: Page, private props: ToggleProps) {}

  static async create(page: Page, props: Partial<ToggleProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <ToggleComponent {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new ToggleDSL(page, merged as ToggleProps)
  }

  private async render() {
    const body = await <ToggleComponent {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<ToggleProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  // Convenience setters
  async setTestId(v: string) { await this.setProps({ testId: v }) }
  async setExpandIcon(node: any) { await this.setProps({ expandIcon: node }) }
  async setCollapseIcon(node: any) { await this.setProps({ collapseIcon: node }) }

  // Locators
  get button() { return this.page.getByTestId(this.props.testId ?? 'toggle') }
  get expandIcon() { return this.page.locator('span.expand-icon') }
  get collapseIcon() { return this.page.locator('span.collapse-icon') }
}

export const test = base.extend<{ toggle: ToggleDSL }>({
  toggle: async ({ page }, use) => {
    await use(await ToggleDSL.create(page))
  }
})
