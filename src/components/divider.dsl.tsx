/** @jsxImportSource @kitajs/html */

import { Children } from "@kitajs/html"
import { Page, test as base } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml.js"
import { Divider, DividerProps } from "./divider.js"

export { expect } from "@playwright/test"

const DefaultProps: DividerProps = {
  id: "divider-1",
}

export class DividerDSL {
  private constructor(private readonly page: Page, private props: DividerProps, private children: Children) {}

  static async create(page: Page, props: Partial<DividerProps> = {}, children: Children = "Divider") {
    const merged = { ...DefaultProps, ...props }
    const body = await (
      <Divider id={merged.id}>
        {children}
      </Divider>
    )
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new DividerDSL(page, merged, children)
  }

  private async render() {
    const body = await (
      <Divider id={this.props.id}>
        {this.children}
      </Divider>
    )
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<DividerProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  async setId(id: string) { await this.setProps({ id }) }

  async setChildren(children: any) {
    this.children = children
    await this.render()
  }

  async setChildrenText(text: string) { await this.setChildren(text) }
  async setChildrenElements(...els: any[]) { await this.setChildren(els) }
  async clearChildren() { await this.setChildren(null) }

  // Locators
  get root() { return this.page.locator(`#${this.props.id}`) }
  get label() { return this.root.locator(':scope > span') }
  byTestId(id: string) { return this.page.getByTestId(id) }
}

export const test = base.extend<{ divider: DividerDSL }>({
  divider: async ({ page }, use) => {
    await use(await DividerDSL.create(page))
  }
})
