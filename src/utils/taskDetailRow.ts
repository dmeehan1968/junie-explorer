import { escapeHtml } from './escapeHtml.js'
import { EventRecord } from '../schema/eventRecord.js'

export interface TaskDetailRowOptions {
  eventRecord: EventRecord
  index: number
  locale?: string
  testIdPrefix?: string
}

/**
 * Renders a task detail row as an HTML table row fragment
 * @param options - Configuration options for rendering the task detail row
 * @returns HTML string representing a table row
 */
export function TaskDetailRow(options: TaskDetailRowOptions): string {
  const {
    eventRecord,
    index,
    locale = 'en-US',
    testIdPrefix = 'detail-row'
  } = options

  // Format timestamp
  const formattedTimestamp = eventRecord.timestamp.toLocaleString(locale)

  // Generate test ID
  const testId = `${testIdPrefix}-${index}`

  // Determine if there's a parse error for styling
  const hasParseError = eventRecord.parseError !== undefined
  const errorClass = hasParseError ? 'bg-red-100 text-red-800' : ''

  return `
    <tr data-testid="${testId}" class="text-base-content">
      <td class="text-left whitespace-nowrap">${escapeHtml(formattedTimestamp)}</td>
      <td class="text-left whitespace-nowrap ${errorClass}">
        ${escapeHtml(eventRecord.event.type)}
        ${hasParseError ? '(parseError)' : ''}
      </td>
      <td class="text-left pr-0">
        <div class="max-h-48 overflow-auto bg-base-200 text-base-content rounded font-mono text-xs whitespace-pre break-all">${escapeHtml(JSON.stringify(eventRecord.event, null, 2))}</div>
      </td>
    </tr>
  `
}