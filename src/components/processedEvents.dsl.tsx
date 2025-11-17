/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml"
import { MessageTrajectoriesSection } from "./messageTrajectoriesSection"
import type { EventRecord } from "../schema/eventRecord"
import type { LlmRequestEvent, MatterhornMessage } from "../schema/llmRequestEvent"
import type { LlmResponseEvent } from "../schema/llmResponseEvent"

// Minimal LLM factory
const llm = (overrides: Partial<any> = {}) => ({
  jbai: 'OpenAI-4.1',
  isSummarizer: false,
  capabilities: { inputPrice: 0, outputPrice: 0, cacheInputPrice: 0, cacheCreateInputPrice: 0, webSearchPrice: 0 },
  ...overrides,
})

// Minimal Request/Response builders
const requestEvent = (overrides: Partial<LlmRequestEvent> = {}): LlmRequestEvent => ({
  type: 'LlmRequestEvent',
  id: overrides.id ?? 'req-1',
  chat: {
    system: 'You are helpful',
    messages: [],
    tools: [],
    ...overrides['chat' as keyof LlmRequestEvent] as any,
  },
  modelParameters: {
    model: llm(),
    reasoning_effort: 'medium',
    prompt_cache_enabled: false,
    ...overrides['modelParameters' as keyof LlmRequestEvent] as any,
  },
  attemptNumber: 1,
  ...overrides,
})

const responseContentChoice = (content: string) => ({
  type: 'com.intellij.ml.llm.matterhorn.llm.AIContentAnswerChoice',
  content,
})

const responseToolUseChoice = (usages: any[]) => ({
  type: 'com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice',
  usages: usages.map(u => ({ id: u.id ?? Math.random().toString(), toolName: u.name, toolParams: { rawJsonObject: u.input?.rawJsonObject ?? u.params ?? {} } })),
})

const responseEvent = (overrides: Partial<LlmResponseEvent> = {}): LlmResponseEvent => ({
  type: 'LlmResponseEvent',
  id: overrides.id ?? 'req-1',
  answer: {
    llm: llm(),
    contentChoices: [],
    time: 0,
    usage: {},
    webSearchCount: 0,
    ...overrides['answer' as keyof LlmResponseEvent] as any,
  },
  ...overrides,
})

const agentActionFinished = (text: string) => ({
  type: 'AgentActionExecutionFinished',
  actionToExecute: { type: 'tool', id: 't1', name: 'echo' },
  result: { text },
})

const buildFailed = (message?: string) => ({
  type: 'ActionRequestBuildingFailed',
  serializableThrowable: message ? { message } : undefined,
})

const asRecord = (event: any, timestamp: Date = new Date(0)): EventRecord => ({ event, timestampMs: timestamp } as any)

export type MessageTrajectoriesProps = {
  events: EventRecord[]
}

const DefaultProps: MessageTrajectoriesProps = {
  events: [],
}

export class MessageTrajectoriesDSL {
  private constructor(private readonly page: Page, private props: MessageTrajectoriesProps) {}

  static async create(page: Page, props: Partial<MessageTrajectoriesProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <MessageTrajectoriesSection {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new MessageTrajectoriesDSL(page, merged)
  }

  async setProps(props: Partial<MessageTrajectoriesProps> = {}) {
    this.props = { ...this.props, ...props }
    const body = await <MessageTrajectoriesSection {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  // Builders to compose event arrays
  empty() { return [] as EventRecord[] }
  withRequest(overrides: Partial<LlmRequestEvent> = {}) { return [asRecord(requestEvent(overrides))] }
  withSummarizerResponse(content: string) {
    return [asRecord(responseEvent({ answer: { llm: llm({ isSummarizer: true }), contentChoices: [responseContentChoice(content)] } as any }))]
  }
  withAssistantResponse(opts: { id?: string, content?: string, time?: number, reasoning?: string, webSearchCount?: number }) {
    const req = requestEvent({ id: opts.id ?? 'x', modelParameters: { model: llm({ isSummarizer: false }), reasoning_effort: opts.reasoning ?? 'medium', prompt_cache_enabled: false } as any })
    const res = responseEvent({ id: req.id, answer: { llm: llm({ isSummarizer: false }), time: opts.time ?? 500, contentChoices: opts.content !== undefined ? [responseContentChoice(opts.content)] : [], webSearchCount: opts.webSearchCount ?? 0 } as any })
    return [asRecord(req), asRecord(res)]
  }
  withAssistantToolUse(opts: { usages: any[] }) {
    const req = requestEvent({ id: 'tu-1' })
    const res = responseEvent({ id: 'tu-1', answer: { llm: llm(), contentChoices: [responseToolUseChoice(opts.usages)] } as any })
    return [asRecord(req), asRecord(res)]
  }
  withToolResult(text: string) { return [asRecord(agentActionFinished(text))] }
  withToolError(message?: string) { return [asRecord(buildFailed(message))] }

  // Convenience prop setters
  async setEvents(events: EventRecord[]) { await this.setProps({ events }) }

  // Locators
  get section() { return this.page.getByTestId('message-trajectories') }
  get noEvents() { return this.page.getByTestId('no-events-message') }

  get systemMessage() { return this.page.getByTestId('system-message').locator('..') }
  get userTools() { return this.page.getByTestId('user-tools').locator('..') }
  get chatMessages() { return this.page.getByTestId(/(user|assistant)-chat/).locator('..') }

  get dividerHistory() { return this.page.locator('#history') }
  get dividerCurrent() { return this.page.locator('#current-session') }

  get summarizerAssistant() { return this.page.getByTestId('summarizer-assistant').locator('..') }
  get webSearchAssistant() { return this.page.getByTestId('web-search-assistant').locator('..') }
  get chatAssistant() { return this.page.getByTestId('chat-assistant').locator('..') }
  get toolUse() { return this.page.getByTestId('tool-use').locator('..') }
  get toolResult() { return this.page.getByTestId('tool-result').locator('..') }
  get toolError() { return this.page.getByTestId('tool-error').locator('..') }
}

export const test = base.extend<{ messageTrajectories: MessageTrajectoriesDSL }>({
  messageTrajectories: async ({ page }, use) => {
    await use(await MessageTrajectoriesDSL.create(page))
  }
})
