import { escapeHtml } from './escapeHtml.js'
import { ToggleComponent } from './toggleComponent.js'

export interface TrajectoryRowOptions {
  timestamp?: Date
  role: string
  content: string
  index: number
  locale?: string
  expandIcon: string
  collapseIcon: string
  cssClass?: string
  testIdPrefix?: string
}

/**
 * Renders a trajectory row as an HTML table row fragment
 * @param options - Configuration options for rendering the trajectory row
 * @returns HTML string representing a table row
 */
export function TrajectoryRow(options: TrajectoryRowOptions): string {
  const {
    timestamp,
    role,
    content,
    index,
    locale = 'en-US',
    expandIcon,
    collapseIcon,
    cssClass = '',
    testIdPrefix = 'trajectory-row'
  } = options

  // Format timestamp
  const formattedTimestamp = timestamp instanceof Date ? timestamp.toLocaleString(locale) : String(timestamp)

  // Generate CSS classes
  const rowClasses = cssClass || ''

  // Generate test ID
  const testId = `${testIdPrefix}-${index}`

  return `
    <tr data-testid="${testId}" ${rowClasses ? `class="${rowClasses}"` : ''}>
      <td class="timestamp-col">${escapeHtml(formattedTimestamp)}</td>
      <td class="role-col">${escapeHtml(role)}</td>
      <td class="content-col">
        <div class="content-cell-container relative">
          ${ToggleComponent({
            expandIcon,
            collapseIcon,
            testIdPrefix: 'trajectory-toggle',
            index
          })}
          <div class="content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words p-2 transition-all duration-300 ease-in-out">${escapeHtml(content.trim())}</div>
        </div>
      </td>
    </tr>
  `
}