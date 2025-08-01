import { Event } from "../schema/event.js"
import { escapeHtml } from "./escapeHtml.js"
import { EventFormatter, FlexGridRow } from "./eventFormatters.js"

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
      hasParseError,
    }]
  }
}