import { Event } from '../schema/event.js'
import { LlmRequestEvent } from '../schema/llmRequestEvent.js'
import { DefaultEventFormatter } from "./defaultEventFormatter.js"
import { LlmRequestFormatter } from "./llmRequestFormatter.js"

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
  formatFlexGrid(event: Event, timestamp: string, hasParseError?: boolean): FlexGridRow[]
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
    return formatter.formatFlexGrid(event, timestamp, hasParseError)
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