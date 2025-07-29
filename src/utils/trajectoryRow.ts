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

  // Generate CSS classes with alternating background colors
  const backgroundClass = index % 2 === 0 ? 'bg-base-100' : 'bg-base-50'
  const rowClasses = cssClass ? `${cssClass} ${backgroundClass}` : backgroundClass

  // Generate test ID
  const testId = `${testIdPrefix}-${index}`

  return `
    <tr data-testid="${testId}" ${rowClasses ? `class="${rowClasses}"` : ''}>
      <td class="timestamp-col align-top">${escapeHtml(formattedTimestamp)}</td>
      <td class="role-col align-top">${escapeHtml(role)}</td>
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