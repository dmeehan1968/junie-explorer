/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml.js"
import { MultiPartMessage } from "./multiPartMessage.js"
import type { ChatMessagePart } from "../schema/multiPartChatMessage.js"

export type MultiPartMessageProps = {
  part: ChatMessagePart
}

const DefaultProps: MultiPartMessageProps = {
  part: { type: 'text', text: 'Hello world' } as any
}

export class MultiPartMessageDSL {
  private constructor(private readonly page: Page, private props: MultiPartMessageProps) {}

  static async create(page: Page, props: Partial<MultiPartMessageProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <MultiPartMessage {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new MultiPartMessageDSL(page, merged)
  }

  private async render() {
    const body = await <MultiPartMessage {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setPart(part: ChatMessagePart | any) {
    this.props = { ...this.props, part }
    await this.render()
  }

  // Helpers
  async setText(text: string) {
    await this.setPart({ type: 'text', text } as any)
  }

  async setImage(contentType: string, base64: string) {
    await this.setPart({ type: 'image', contentType, base64 } as any)
  }

  // Locators
  get img() { return this.page.locator('img.chat-image-thumb') }
  get body() { return this.page.locator('body') }
}

export const test = base.extend<{ multiPart: MultiPartMessageDSL }>({
  multiPart: async ({ page }, use) => {
    await use(await MultiPartMessageDSL.create(page))
  }
})
