import { escapeHtml } from '../utils/escapeHtml.js'
import { EventRecord } from '../schema/eventRecord.js'
import { EventFormatter } from '../utils/eventFormatters.js'

export interface TaskDetailFlexGridOptions {
  eventRecord: EventRecord
  index: number
  locale?: string
  testIdPrefix?: string
  eventFormatter: EventFormatter
}

/**
 * Renders a task detail event as flex grid items
 * @param options - Configuration options for rendering the task detail flex grid
 * @returns HTML string representing flex grid items
 */
export function TaskDetailFlexGrid(options: TaskDetailFlexGridOptions): string {
  const {
    eventRecord,
    index,
    locale = 'en-US',
    testIdPrefix = 'detail-item',
    eventFormatter
  } = options

  // Format timestamp
  const formattedTimestamp = eventRecord.timestamp.toLocaleString(locale)

  // Determine if there's a parse error for styling
  const hasParseError = eventRecord.parseError !== undefined

  // Get flex grid rows from formatter
  const flexGridRows = eventFormatter.formatFlexGrid(eventRecord.event, formattedTimestamp, hasParseError)

  // Generate HTML for each row
  return flexGridRows.map((row, rowIndex) => {
    const testId = `${testIdPrefix}-${index}-${rowIndex}`
    const errorClass = row.hasParseError ? 'bg-red-100 text-red-800' : ''
    
    return `
      <div class="event-item flex flex-col md:flex-row gap-4 p-4 bg-base-100 border border-base-300 rounded-lg mb-4" 
           data-testid="${testId}" 
           data-event-type="${escapeHtml(row.eventType)}">
        <div class="flex-shrink-0 md:w-48">
          <div class="text-sm font-medium text-base-content/70 mb-1">Timestamp</div>
          <div class="text-sm text-base-content">${escapeHtml(row.timestamp)}</div>
        </div>
        <div class="flex-shrink-0 md:w-56">
          <div class="text-sm font-medium text-base-content/70 mb-1">Event Type</div>
          <div class="text-sm text-base-content ${errorClass}">
            ${escapeHtml(row.eventType)}
            ${row.hasParseError ? ' (parseError)' : ''}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-base-content/70 mb-1">JSON</div>
          <div 
            class="max-h-48 overflow-auto bg-base-200 text-base-content rounded font-mono text-xs whitespace-pre break-all p-2"
          >${row.content}</div>
        </div>
      </div>
    `
  }).join('')
}