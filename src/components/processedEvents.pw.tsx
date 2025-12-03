/** @jsxImportSource @kitajs/html */

import { AgentType } from "../schema/agentType"
import { test, expect } from './processedEvents.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('ProcessedEvents', () => {
  test('renders empty state when no events', async ({ messageTrajectories }) => {
    await messageTrajectories.setEvents(messageTrajectories.empty())
    await expect(messageTrajectories.noEvents).toBeVisible()
    await expect(messageTrajectories.section).toBeVisible()
  })

  test.describe('Initial context from first non-summarizer request', () => {
    test('renders system message, tools (none), chat messages, and dividers', async ({ messageTrajectories, page }) => {
      const req = {
        chat: {
          system: 'System <b>HTML</b>',
          messages: [
            { type: 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage', content: 'Hello <u>World</u>', kind: 'User' },
            { type: 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage', content: 'Hi there', kind: 'Assistant' },
          ],
          tools: [],
        },
      } as any

      await messageTrajectories.setEvents(messageTrajectories.withRequest(req))

      await expect(messageTrajectories.dividerHistory).toBeVisible()
      await expect(messageTrajectories.systemMessage).toBeVisible()
      await expect(messageTrajectories.systemMessage).toContainText('System <b>HTML</b>')
      await expect(messageTrajectories.userTools).toBeVisible()
      await expect(messageTrajectories.userTools).toContainText('No tools listed')
      await expect(messageTrajectories.chatMessages).toHaveCount(2)
      await expect(messageTrajectories.dividerCurrent).toBeVisible()
    })

    test('includes tools when provided', async ({ messageTrajectories }) => {
      const req = {
        chat: {
          system: 'ok',
          tools: [ { name: 'search', description: 'Search', parameters: { type: 'object', properties: {} } } ],
          messages: [],
        },
      } as any

      await messageTrajectories.setEvents(messageTrajectories.withRequest(req))
      await expect(messageTrajectories.userTools).toBeVisible()
      // ToolDecorator content should show tool name
      await expect(messageTrajectories.userTools).toContainText('search')
    })

    test('does not render history twice when multiple requests', async ({ messageTrajectories }) => {
      const events = [
        ...messageTrajectories.withRequest({ id: 'a' }),
        ...messageTrajectories.withRequest({ id: 'b' }),
      ]
      await messageTrajectories.setEvents(events)
      await expect(messageTrajectories.dividerHistory).toHaveCount(1)
      await expect(messageTrajectories.dividerCurrent).toHaveCount(1)
    })
  })

  test.describe('Summarizer responses', () => {
    test('renders summary messages for summarizer LLM, skips empty content', async ({ messageTrajectories }) => {
      const events = messageTrajectories.withSummarizerResponse('Summary <em>content</em>')
      await messageTrajectories.setEvents(events)
      await expect(messageTrajectories.summarizerAssistant).toHaveCount(1)
      await expect(messageTrajectories.summarizerAssistant).toContainText('Summary <em>content</em>')
    })
  })

  test.describe('Assistant responses (non-summarizer)', () => {
    test('renders latency and reasoning effort in label and content choice', async ({ messageTrajectories }) => {
      const events = messageTrajectories.withAssistantResponse({ id: 'x', content: 'Answer', time: 1250, reasoning: 'medium' })
      await messageTrajectories.setEvents(events)
      await expect(messageTrajectories.chatAssistant).toHaveCount(1)
      // label includes time in seconds with two decimals and reasoning effort
      await expect(messageTrajectories.chatAssistant.locator('h3')).toContainText('1.25s/reasoning medium')
      await expect(messageTrajectories.chatAssistant).toContainText('Answer')
    })

    test('renders web search count badge when > 0', async ({ messageTrajectories }) => {
      const events = messageTrajectories.withAssistantResponse({ id: 'y', content: 'Ans', time: 100, reasoning: 'low', webSearchCount: 3 })
      await messageTrajectories.setEvents(events)
      await expect(messageTrajectories.webSearchAssistant).toHaveCount(1)
      await expect(messageTrajectories.webSearchAssistant).toContainText('Count: 3')
    })

    test('renders tool use answer choices via ToolCallDecorator entries', async ({ messageTrajectories }) => {
      const events = messageTrajectories.withAssistantToolUse({ usages: [
        { id: '1', name: 'search', input: { rawJsonObject: { q: 'kotlin' } } },
        { id: '2', name: 'echo', input: { rawJsonObject: { text: 'hello' } } },
      ]})
      await messageTrajectories.setEvents(events)
      await expect(messageTrajectories.toolUse).toHaveCount(2)
    })
  })

  test.describe('Tool results and errors', () => {
    test('renders tool result from AgentActionExecutionFinished', async ({ messageTrajectories }) => {
      await messageTrajectories.setEvents(messageTrajectories.withToolResult('ok <b>bold</b>'))
      await expect(messageTrajectories.toolResult).toHaveCount(1)
      await expect(messageTrajectories.toolResult).toContainText('ok <b>bold</b>')
    })

    test('renders tool error with fallback message when not provided', async ({ messageTrajectories }) => {
      await messageTrajectories.setEvents(messageTrajectories.withToolError())
      await expect(messageTrajectories.toolError).toHaveCount(1)
      await expect(messageTrajectories.toolError).toContainText('Unspecified error')
    })

    test('renders tool error with provided throwable message', async ({ messageTrajectories }) => {
      await messageTrajectories.setEvents(messageTrajectories.withToolError('boom'))
      await expect(messageTrajectories.toolError).toHaveCount(1)
      await expect(messageTrajectories.toolError).toContainText('boom')
    })
  })

  test.describe('Filtering behavior', () => {
    test('filters out summarizer LlmRequestEvent but includes summarizer LlmResponseEvent', async ({ messageTrajectories }) => {
      const reqSummarizer = messageTrajectories.withRequest({ chat: { system: 'You are a task step summarizer', tools: [] } as any })
      const summarizerRes = messageTrajectories.withSummarizerResponse('S')
      const events = [ ...reqSummarizer, ...summarizerRes ]
      await messageTrajectories.setEvents(events)
      // No history divider because the only request is summarizer (filtered out)
      await expect(messageTrajectories.dividerHistory).toHaveCount(0)
      await expect(messageTrajectories.summarizerAssistant).toHaveCount(1)
    })
  })
})
