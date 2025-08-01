import { LlmRequestEvent } from "../schema/llmRequestEvent.js"
import { escapeHtml } from "./escapeHtml.js"
import { EventFormatter, FlexGridRow } from "./eventFormatters.js"

/**
 * LLM Request formatter that uses the same formatting as the default formatter
 */
export class LlmRequestFormatter implements EventFormatter {
  format(event: LlmRequestEvent): string {
    return escapeHtml(JSON.stringify(event, null, 2))
  }

  formatFlexGrid(event: LlmRequestEvent, timestamp: string, hasParseError?: boolean): FlexGridRow[] {

    const rows: FlexGridRow[] = []

    // Add row for system message if it exists
    if (event.chat.system) {
      rows.push({
        timestamp,
        eventType: event.type,
        content: escapeHtml(event.chat.system),
        hasParseError,
      })
    }

    // Add rows for each message if they exist
    if (event.chat.messages && Array.isArray(event.chat.messages)) {
      event.chat.messages.forEach(message => {
        // Handle ChatMessage
        if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage') {
          rows.push({
            timestamp,
            eventType: event.type,
            content: escapeHtml(message.content),
            hasParseError,
          })
        }
        // Handle MultiPartChatMessage
        else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage') {
          if (message.parts && Array.isArray(message.parts)) {
            message.parts.forEach(part => {
              if (part.type === 'text' && part.text) {
                rows.push({
                  timestamp,
                  eventType: event.type,
                  content: escapeHtml(part.text),
                  hasParseError,
                })
              } else if (part.type === 'image') {
                rows.push({
                  timestamp,
                  eventType: event.type,
                  content: escapeHtml(`[Image: ${part.contentType || 'unknown type'}]`),
                  hasParseError,
                })
              }
            })
          }
        }
        // Handle AssistantChatMessageWithToolUses
        else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses') {
          if (message.content) {
            rows.push({
              timestamp,
              eventType: event.type,
              content: escapeHtml(message.content),
              hasParseError,
            })
          }
        }
        // Handle UserChatMessageWithToolResults
        else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults') {
          if (message.toolResults && Array.isArray(message.toolResults)) {
            message.toolResults.forEach(toolResult => {
              if (toolResult.content) {
                rows.push({
                  timestamp,
                  eventType: event.type,
                  content: escapeHtml(toolResult.content),
                  hasParseError,
                })
              }
            })
          }
        }
      })
    }

    // If no chat data found, fall back to default behavior
    if (rows.length === 0) {
      return [{
        timestamp,
        eventType: event.type,
        content: escapeHtml(JSON.stringify(event, null, 2)),
        hasParseError,
      }]
    }

    return rows
  }
}