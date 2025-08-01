import { Event } from '../schema/event.js'
import { escapeHtml } from './escapeHtml.js'

/**
 * Base interface for event formatters
 */
export interface EventFormatter {
  /**
   * Formats an event object into HTML string
   * @param event - The event to format
   * @returns HTML string representation of the event
   */
  format(event: Event): string
}

/**
 * Default formatter that uses JSON.stringify with pretty printing
 */
export class DefaultEventFormatter implements EventFormatter {
  format(event: Event): string {
    return escapeHtml(JSON.stringify(event, null, 2))
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
}

/**
 * Factory function to create a configured event formatter decorator
 * @returns A configured EventFormatterDecorator instance
 */
export function createEventFormatter(): EventFormatterDecorator {
  const decorator = new EventFormatterDecorator()
  
  // Future custom formatters can be registered here
  // Example:
  // decorator.registerFormatter('LlmRequestEvent', new LlmRequestFormatter())
  // decorator.registerFormatter('AgentActionExecutionStarted', new AgentActionFormatter())
  
  return decorator
}