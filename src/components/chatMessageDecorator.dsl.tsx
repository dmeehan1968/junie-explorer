/** @jsxImportSource @kitajs/html */

import { test as base, Page, expect } from "@playwright/test"
export { expect } from "@playwright/test"
import { Children } from "@kitajs/html"
import { wrapHtml } from "../utils/wrapHtml.js"
import { ChatMessageDecorator } from "./chatMessageDecorator.js"
import type { MatterhornMessage } from "../schema/llmRequestEvent.js"

export type ChatMessageDecoratorProps = {
  klass: string
  message: MatterhornMessage
}

const userSimple = (content: string): MatterhornMessage => ({
  type: 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage',
  content,
  kind: 'User'
})

const assistantSimple = (content: string): MatterhornMessage => ({
  type: 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage',
  content,
  kind: 'Assistant'
})

const userMultiPart = (parts: any[]): MatterhornMessage => ({
  type: 'com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage',
  parts,
  kind: 'User'
})

const assistantWithToolUses = (content: string | undefined, toolUses: any[]): MatterhornMessage => ({
  type: 'com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses',
  content: content ?? '',
  toolUses,
}) as any

const userWithToolResults = (toolResults: any[]): MatterhornMessage => ({
  type: 'com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults',
  toolResults,
}) as any

const DefaultProps: ChatMessageDecoratorProps = {
  klass: 'bg-base-200 p-4',
  message: userSimple('Hello world')
}

export class ChatMessageDecoratorDSL {
  private constructor(private readonly page: Page, private props: ChatMessageDecoratorProps) {}

  static async create(page: Page, props: Partial<ChatMessageDecoratorProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <ChatMessageDecorator {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new ChatMessageDecoratorDSL(page, merged)
  }

  async setContent(props: Partial<ChatMessageDecoratorProps> = {}) {
    this.props = { ...this.props, ...props }
    const body = await <ChatMessageDecorator {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  // Helpers to quickly set message variants
  async setUserSimple(content: string) {
    await this.setContent({ message: userSimple(content) })
  }

  async setAssistantSimple(content: string) {
    await this.setContent({ message: assistantSimple(content) })
  }

  async setUserMultiPart(parts: any[]) {
    await this.setContent({ message: userMultiPart(parts) })
  }

  async setAssistantWithToolUses(content: string | undefined, toolUses: any[]) {
    await this.setContent({ message: assistantWithToolUses(content, toolUses) as any })
  }

  async setUserWithToolResults(toolResults: any[]) {
    await this.setContent({ message: userWithToolResults(toolResults) as any })
  }

  // Locators by testId
  get userChatMessage() { return this.page.getByTestId('user-chat-message').locator('..') }
  get assistantChatMessage() { return this.page.getByTestId('assistant-chat-message').locator('..') }
  get userChatMultipart() { return this.page.getByTestId('user-chat-multipart').locator('..') }
  get assistantChatMultipart() { return this.page.getByTestId('assistant-chat-multipart').locator('..') }
  get assistantMessage() { return this.page.getByTestId('assistant-message').locator('..') }
  get assistantToolUse() { return this.page.getByTestId('assistant-tool-use').locator('..') }
  get userToolResult() { return this.page.getByTestId('user-tool-result').locator('..') }

  // Generic helpers
  get headers() { return this.page.locator('h3') }
  get contentWrappers() { return this.page.locator('.content-wrapper') }

  // For margin alignment check, target the parent container used by MessageDecorator
  get containers() { return this.page.locator('div.relative.mb-8') }
}

export const test = base.extend<{ chatMessage: ChatMessageDecoratorDSL }>({
  chatMessage: async ({ page }, use) => {
    await use(await ChatMessageDecoratorDSL.create(page))
  }
})
