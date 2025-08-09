import { marked } from 'marked'
import { escapeHtml } from '../utils/escapeHtml.js'
import { formatSeconds } from '../utils/timeUtils.js'
import { SummaryMetrics } from '../schema.js'

export interface TaskCardProps {
  projectName: string
  issueId: string
  taskIndex: number | string
  // minimal task shape the component relies on
  task: {
    id: string | number
    created: Date | string | number
    context: { description?: string }
    metrics: Promise<SummaryMetrics>
  }
  locale: string | undefined
  // Optional presentation options
  title?: string // defaults to Initial Request / Follow up N in routes that want it
  showLinks?: boolean // defaults to true
  showJsonToggle?: boolean // defaults to true
  actionsHtml?: string // optional actions to render next to the created date
}

function generateStepTotalsTable(summaryData: SummaryMetrics): string {
  return `
  <div class="overflow-x-auto mb-4" data-testid="task-metrics">
    <table class="table w-full bg-base-300">
      <tbody>
        <tr>
          ${summaryData.metricCount > 0
            ? `
                <td class="text-sm text-center"><span class="font-semibold">Input Tokens:</span> ${summaryData.inputTokens}</td>
                <td class="text-sm text-center"><span class="font-semibold">Output Tokens:</span> ${summaryData.outputTokens}</td>
                <td class="text-sm text-center"><span class="font-semibold">Cache Tokens:</span> ${summaryData.cacheTokens}</td>
                <td class="text-sm text-center"><span class="font-semibold">Cost:</span> ${summaryData.cost.toFixed(4)}</td>
              `
            : ``
          }
          <td class="text-sm text-center"><span class="font-semibold">Total Time:</span> ${formatSeconds(summaryData.time / 1000)}</td>
        </tr>
      </tbody>
    </table>
  </div>
`}

export async function TaskCard({ projectName, issueId, taskIndex, task, locale, title, showLinks = true, showJsonToggle = true, actionsHtml }: TaskCardProps): Promise<string> {
  const computedTitle = title ?? (Number(taskIndex) === 0 ? 'Initial Request' : `Follow up ${taskIndex}`)
  const created = new Date(task.created)

  return `
  <div class="card bg-base-200 shadow-md border border-base-300 hover:shadow-lg transition-all duration-300" data-testid="task-item">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-primary">${escapeHtml(computedTitle)}</h3>
        <div class="flex items-center gap-2">
          <div class="text-sm text-base-content/70">Created: ${created.toLocaleString(locale)}</div>
          ${actionsHtml ? `<div class="ml-2">${actionsHtml}</div>` : ''}
        </div>
      </div>
      ${task.context.description ? `<div class="prose prose-sm max-w-none mb-4 p-4 bg-base-300 rounded-lg" data-testid="task-description">${marked(escapeHtml(task.context.description))}</div>` : ''}
      <div data-testid="task-details">
        ${generateStepTotalsTable(await task.metrics)}
      </div>
      ${showLinks ? `
      <div class="flex flex-wrap gap-2 mt-4">
        <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(String(taskIndex))}/events" class="btn btn-primary btn-sm flex-1 min-w-0" data-testid="events-button">Events</a>
        <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(String(taskIndex))}/trajectories" class="btn btn-primary btn-sm flex-1 min-w-0" data-testid="trajectories-button">Trajectories</a>
        ${showJsonToggle ? `<button class="btn btn-primary btn-sm flex-1 min-w-0 toggle-raw-data" data-task="${encodeURIComponent(String(taskIndex))}" data-testid="json-button">Raw JSON</button>` : ''}
      </div>` : ''}
      ${showJsonToggle ? `
      <div id="raw-data-${encodeURIComponent(String(taskIndex))}" class="mt-4 p-4 bg-base-300 rounded-lg font-mono border border-base-300 hidden" data-testid="json-viewer">
        <div id="json-renderer-${encodeURIComponent(String(taskIndex))}" class="text-sm"></div>
      </div>` : ''}
    </div>
  </div>
`}
