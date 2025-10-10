/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { Children } from "@kitajs/html"
import { MessageDecorator } from "./messageDecorator.js"
import { wrapHtml } from "../utils/wrapHtml.js"

export type MessageDecoratorProps = {
  klass: string
  testId: string
  left: boolean
  label?: string
  content: string | Children
}

const DefaultProps: MessageDecoratorProps = {
  klass: 'bg-base-200 p-4',
  testId: 'message-toggle',
  left: true,
  label: 'Label',
  content: 'Hello world'
}

export class MessageDecoratorDSL {
  private constructor(private readonly page: Page, private props: MessageDecoratorProps) {}

  static async create(page: Page, props: Partial<MessageDecoratorProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <MessageDecorator {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new MessageDecoratorDSL(page, merged)
  }

  async setContent(props: Partial<MessageDecoratorProps> = {}) {
    this.props = { ...this.props, ...props }
    const body = await <MessageDecorator {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  // Root wrapper: div.relative.mb-8 with ml/mr-48 depending on left
  get container() {
    return this.page.locator('div.relative.mb-8')
  }

  // Toggle button located by data-testid (passed via props.testId)
  toggle(testId: string = this.props.testId) {
    return this.page.getByTestId(testId)
  }

  // Header h3 containing the label text
  get header() {
    return this.page.locator('h3')
  }

  async headerText() {
    return (await this.header.textContent())?.trim() ?? ''
  }

  // Content wrapper
  get contentWrapper() {
    return this.page.locator('.content-wrapper')
  }

  async contentWrapperClassList() {
    const cls = await this.contentWrapper.getAttribute('class')
    return (cls ?? '').split(/\s+/)
  }
}

export const test = base.extend<{ messageDecorator: MessageDecoratorDSL }>({
  messageDecorator: async ({ page }, use) => {
    await use(await MessageDecoratorDSL.create(page))
  }
})
