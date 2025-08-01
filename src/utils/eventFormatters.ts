import { Event } from '../schema/event.js'
import { LlmRequestEvent } from '../schema/llmRequestEvent.js'
import { escapeHtml } from './escapeHtml.js'

/**
 * Represents a single row in the flex grid layout
 */
export interface FlexGridRow {
  timestamp: string
  eventType: string
  content: string
  hasParseError?: boolean
}

/**
 * Base interface for event formatters
 */
export interface EventFormatter {
  /**
   * Formats an event object into HTML string (legacy method for backward compatibility)
   * @param event - The event to format
   * @returns HTML string representation of the event
   */
  format(event: Event): string

  /**
   * Formats an event object into flex grid rows
   * @param event - The event to format
   * @param timestamp - The formatted timestamp string
   * @param hasParseError - Whether the event has a parse error
   * @returns Array of flex grid rows
   */
  formatFlexGrid?(event: Event, timestamp: string, hasParseError?: boolean): FlexGridRow[]
}

/**
 * Default formatter that uses JSON.stringify with pretty printing
 */
export class DefaultEventFormatter implements EventFormatter {
  format(event: Event): string {
    return escapeHtml(JSON.stringify(event, null, 2))
  }

  formatFlexGrid(event: Event, timestamp: string, hasParseError?: boolean): FlexGridRow[] {
    return [{
      timestamp,
      eventType: event.type,
      content: escapeHtml(JSON.stringify(event, null, 2)),
      hasParseError
    }]
  }
}

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
        hasParseError
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
            hasParseError
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
                  hasParseError
                })
              } else if (part.type === 'image') {
                rows.push({
                  timestamp,
                  eventType: event.type,
                  content: escapeHtml(`[Image: ${part.contentType || 'unknown type'}]`),
                  hasParseError
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
              hasParseError
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
                  hasParseError
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
        hasParseError
      }]
    }

    return rows
  }
}

/**
 * Event formatter decorator that selects appropriate formatter based on event type
 */
export class EventFormatterDecorator implements EventFormatter {
  private formatters: Map<string, EventFormatter> = new Map()
  private defaultFormatter: EventFormatter

  constructor(defaultFormatter: EventFormatter = new DefaultEventFormatter()) {
    this.defaultFormatter = defaultFormatter
  }

  /**
   * Register a custom formatter for a specific event type
   * @param eventType - The event type to register formatter for
   * @param formatter - The formatter to use for this event type
   */
  registerFormatter(eventType: string, formatter: EventFormatter): void {
    this.formatters.set(eventType, formatter)
  }

  /**
   * Format an event using the appropriate formatter based on event type
   * @param event - The event to format
   * @returns HTML string representation of the event
   */
  format(event: Event): string {
    const formatter = this.formatters.get(event.type) || this.defaultFormatter
    return formatter.format(event)
  }

  /**
   * Format an event using the appropriate formatter for flex grid layout
   * @param event - The event to format
   * @param timestamp - The formatted timestamp string
   * @param hasParseError - Whether the event has a parse error
   * @returns Array of flex grid rows
   */
  formatFlexGrid(event: Event, timestamp: string, hasParseError?: boolean): FlexGridRow[] {
    const formatter = this.formatters.get(event.type) || this.defaultFormatter
    if (formatter.formatFlexGrid) {
      return formatter.formatFlexGrid(event, timestamp, hasParseError)
    }
    // Fallback to default behavior if formatFlexGrid is not implemented
    return [{
      timestamp,
      eventType: event.type,
      content: formatter.format(event),
      hasParseError
    }]
  }
}

/**
 * Factory function to create a configured event formatter decorator
 * @returns A configured EventFormatterDecorator instance
 */
export function createEventFormatter(): EventFormatterDecorator {
  const decorator = new EventFormatterDecorator()
  
  // Register custom formatters for specific event types
  decorator.registerFormatter('LlmRequestEvent', new LlmRequestFormatter())
  
  // Future custom formatters can be registered here
  // Example:
  // decorator.registerFormatter('AgentActionExecutionStarted', new AgentActionFormatter())
  
  return decorator
}