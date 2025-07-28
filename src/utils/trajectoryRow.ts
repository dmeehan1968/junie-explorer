import { escapeHtml } from './escapeHtml.js'

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
        <div class="content-cell-container">
          <button class="content-toggle-btn expand-btn" onclick="toggleContentExpansion(this)" title="Expand content">
            ${expandIcon}
          </button>
          <button class="content-toggle-btn collapse-btn" onclick="toggleContentExpansion(this)" title="Collapse content" style="display: none;">
            ${collapseIcon}
          </button>
          <div class="content-wrapper">${escapeHtml(content.trim())}</div>
        </div>
      </td>
    </tr>
  `
}