/** @jsxImportSource @kitajs/html */

import { test, expect } from './chatMessageDecorator.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('ChatMessageDecorator (component)', () => {
  
  test.describe('Simple chat messages', () => {
    test('renders user message with correct testId, left alignment, label, and escaped content', async ({ chatMessage, page }) => {
      await chatMessage.setUserSimple('Hello <b>World</b> & more')
      await expect(chatMessage.userChatMessage).toBeVisible()
      // left alignment -> container has mr-48 not ml-48
      await expect(chatMessage.userChatMessage).toContainClass('mr-48')
      await expect(chatMessage.userChatMessage).not.toContainClass('ml-48')
      // label
      await expect(chatMessage.userChatMessage.locator('h3')).toHaveText('Message')
      // escaped content: no bold tag rendered, literal brackets present
      await expect(chatMessage.userChatMessage).toContainText('Hello <b>World</b> & more')
    })

    test('renders assistant message with correct testId, right alignment, label, and escaped content', async ({ chatMessage }) => {
      await chatMessage.setAssistantSimple('Response with <i>html</i> chars')
      await expect(chatMessage.assistantChatMessage).toBeVisible()
      // right alignment -> container has ml-48 not mr-48
      await expect(chatMessage.assistantChatMessage).toContainClass('ml-48')
      await expect(chatMessage.assistantChatMessage).not.toContainClass('mr-48')
      // label
      await expect(chatMessage.assistantChatMessage.locator('h3')).toHaveText('Model Response')
      // escaped content
      await expect(chatMessage.assistantChatMessage).toContainText('Response with <i>html</i> chars')
    })
  })

  test.describe('Multi-part chat messages', () => {
    test('renders user multipart with text and image parts, proper labels and testIds', async ({ chatMessage }) => {
      const parts = [
        { type: 'text', text: 'Text part' },
        { type: 'image', contentType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUg' }
      ]
      await chatMessage.setUserMultiPart(parts)

      // There should be two message decorators rendered, each with correct testId
      await expect(chatMessage.userChatMultipart).toHaveCount(2)
      // First label is Message, second label is Image
      await expect(chatMessage.userChatMultipart.nth(0).locator('h3')).toHaveText('Message')
      await expect(chatMessage.userChatMultipart.nth(1).locator('h3')).toHaveText('Image')
      // Alignment left
      await expect(chatMessage.userChatMultipart.nth(0)).toContainClass('mr-48')
      await expect(chatMessage.userChatMultipart.nth(1)).toContainClass('mr-48')
    })
  })

  test.describe('Assistant with tool uses', () => {
    test('renders assistant content (optional) and tool uses with correct testIds', async ({ chatMessage }) => {
      await chatMessage.setAssistantWithToolUses('Some content', [
        { id: '1', name: 'search', input: { rawJsonObject: { q: 'kotlin' } } },
        { id: '2', name: 'echo', input: { rawJsonObject: { text: 'hello' } } },
      ])

      // Assistant content block
      await expect(chatMessage.assistantMessage).toBeVisible()
      await expect(chatMessage.assistantMessage.locator('h3')).toHaveText('Assistant Response')
      await expect(chatMessage.assistantMessage).toContainText('Some content')

      // Tool uses (delegated to ToolCallDecorator) — ensure entries exist
      await expect(chatMessage.assistantToolUse).toHaveCount(2)
    })

    test('omits assistant content block when content is empty but still renders tool uses', async ({ chatMessage }) => {
      await chatMessage.setAssistantWithToolUses('', [
        { id: '1', name: 'search', input: { rawJsonObject: { q: 'ai' } } }
      ])
      await expect(chatMessage.assistantMessage).toHaveCount(0)
      await expect(chatMessage.assistantToolUse).toHaveCount(1)
    })
  })

  test.describe('User tool results', () => {
    test('renders results with proper label and left alignment', async ({ chatMessage }) => {
      await chatMessage.setUserWithToolResults([
        { id: 'r1', content: 'ok', isError: false },
        { id: 'r2', content: 'boom', isError: true }
      ])

      await expect(chatMessage.userToolResult).toHaveCount(2)
      await expect(chatMessage.userToolResult.nth(0).locator('h3')).toHaveText('Tool Result')
      await expect(chatMessage.userToolResult.nth(1).locator('h3')).toHaveText('Tool Result (Error)')
      await expect(chatMessage.userToolResult.nth(0)).toContainClass('mr-48')
      await expect(chatMessage.userToolResult.nth(1)).toContainClass('mr-48')
    })
  })

  test.describe('klass propagation', () => {
    test('applies custom klass to child decorators', async ({ chatMessage }) => {
      const klass = 'bg-red-500 p-2'
      await chatMessage.setContent({ klass })
      const wrappers = chatMessage.contentWrappers
      await expect(wrappers.first()).toContainClass(klass)
      await expect(wrappers.first()).toBeVisible()
    })
  })
})
