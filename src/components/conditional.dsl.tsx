/** @jsxImportSource @kitajs/html */

import { expect, Page, test as base } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml.js"
import { Conditional, ConditionalProps } from "./conditional.js"

export { expect } from "@playwright/test"

const DefaultProps: ConditionalProps = {
  condition: true,
}

export class ConditionalDSL {
  private constructor(private readonly page: Page, private props: ConditionalProps, private children: any) {}

  static async create(page: Page, props: Partial<ConditionalProps> = {}, children: any = "Hello") {
    const merged = { ...DefaultProps, ...props }
    const body = await (
      <Conditional condition={merged.condition}>
        <span data-testid="conditional-root">{children}</span>
      </Conditional>
    )
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new ConditionalDSL(page, merged, children)
  }

  private async render() {
    const body = await (
      <Conditional condition={this.props.condition}>
        <span data-testid="conditional-root">{this.children}</span>
      </Conditional>
    )
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<ConditionalProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  async setCondition(v: boolean) {
    await this.setProps({ condition: v })
  }

  async setChildren(children: any) {
    this.children = children
    await this.render()
  }

  async setChildrenText(text: string) {
    await this.setChildren(text)
  }

  async setChildrenElements(...els: any[]) {
    await this.setChildren(els)
  }

  async clearChildren() {
    await this.setChildren(null)
  }

  // Locators
  get root() { return this.page.getByTestId('conditional-root') }
  // Direct children container (the Conditional renders fragments, so query inside root)
  get content() { return this.root }

  byTestId(id: string) { return this.page.getByTestId(id) }
  byText(text: string) { return this.page.getByText(text) }
}

export const test = base.extend<{ conditional: ConditionalDSL }>({
  conditional: async ({ page }, use) => {
    await use(await ConditionalDSL.create(page))
  }
})
