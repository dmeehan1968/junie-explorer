// No Issues Message Component
import { Project } from "../Project"
import { formatElapsedTime, formatNumber, formatSeconds } from "../utils/timeUtils"
import { Conditional } from "./conditional"
import { IssueRow } from "./issueRow"
import { IssueSearch } from "./issueSearch"

const NoIssuesMessage = () => (
  <p class="p-4 text-center text-base-content/70" data-testid="no-issues-message">
    No issues found for this project
  </p>
)
// Issues Table Component
export const IssuesTable = async ({ project, locale }: { project: Project, locale: string | undefined }) => {
  const issuesCount = (await project.issues).size

  if (issuesCount === 0) {
    return <NoIssuesMessage/>
  }

  const sortedIssues = [...(await project.issues).values()].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  const oldestIssue = sortedIssues[sortedIssues.length - 1]
  const newestIssue = sortedIssues[0]
  const elapsedTimeMs = new Date(newestIssue.created).getTime() - new Date(oldestIssue.created).getTime()
  const elapsedTimeSec = elapsedTimeMs / 1000
  const metrics = await project.metrics

  return (
    <div class="mb-5 bg-base-200 rounded shadow-sm p-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-primary">{issuesCount} Project Issue{issuesCount !== 1 ? 's' : ''}</h3>
        <span class="font-bold text-base-content"
              data-testid="summary-elapsed-time">Elapsed Time: {formatElapsedTime(elapsedTimeSec)}</span>
      </div>
      <IssueSearch projectName={project.name}/>
      <div class="overflow-x-auto">
        <Conditional condition={!project.hasMetrics}>
          <div class="bg-base-content/10 p-4 rounded mb-4">
            This project does not contain token or cost metrics, which means that it is most likely created by the
            Junie General Availability (GA) plugin which does not collect metrics.
          </div>
        </Conditional>
        <Conditional condition={project.hasMetrics}>
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm opacity-70">Select at least two issues to enable compare</div>
            <button id="compareBtn" class="btn btn-primary btn-sm" disabled data-testid="compare-button">Compare
            </button>
          </div>
        </Conditional>
        <table class="table table-zebra w-full bg-base-100" data-testid="issues-table">
          <thead>
          <tr class="bg-base-200!">
            <Conditional condition={project.hasMetrics}>
              <th class="w-10 text-center align-middle">
                <input type="checkbox" id="selectAllIssues" class="checkbox checkbox-sm"
                       aria-label="Select all issues"/>
              </th>
            </Conditional>
            <th class="text-left w-2/5 whitespace-nowrap">Issue Description</th>
            <th class="text-left whitespace-nowrap">Timestamp</th>
            <Conditional condition={project.hasMetrics}>
              <th class="text-right whitespace-nowrap">Input Tokens</th>
              <th class="text-right whitespace-nowrap">Output Tokens</th>
              <th class="text-right whitespace-nowrap">Cache Tokens</th>
              <th class="text-right whitespace-nowrap">Cost</th>
            </Conditional>
            <th class="text-right whitespace-nowrap">Time</th>
            <th class="text-right whitespace-nowrap">Status</th>
            <th class="text-center whitespace-nowrap">LLM</th>
            <th class="text-center whitespace-nowrap">Mode</th>
          </tr>
          <tr class="bg-base-200! font-bold text-base-content">
            <Conditional condition={project.hasMetrics}>
              <td></td>
            </Conditional>
            <td class="text-left whitespace-nowrap" data-testid="header-summary-label">Project Summary</td>
            <td class="text-left whitespace-nowrap"></td>
            <Conditional condition={project.hasMetrics}>
              <td class="text-right whitespace-nowrap"
                  data-testid="header-summary-input-tokens">{formatNumber(metrics.inputTokens)}</td>
              <td class="text-right whitespace-nowrap"
                  data-testid="header-summary-output-tokens">{formatNumber(metrics.outputTokens)}</td>
              <td class="text-right whitespace-nowrap"
                  data-testid="header-summary-cache-tokens">{formatNumber(metrics.cacheTokens)}</td>
              <td class="text-right whitespace-nowrap" data-testid="header-summary-cost">{metrics.cost.toFixed(2)}</td>
            </Conditional>
            <td class="text-right whitespace-nowrap"
                data-testid="header-summary-total-time">{formatSeconds(metrics.time / 1000)}</td>
            <td class="text-right whitespace-nowrap"></td>
            <td class="text-left whitespace-nowrap"></td>
            <td class="text-left whitespace-nowrap"></td>
          </tr>
          </thead>
          <tbody>
          {await Promise.all(sortedIssues.map(async issue => (
            <IssueRow issue={issue} project={project} locale={locale}/>
          )))}
          </tbody>
          <tfoot>
          <tr class="bg-base-200! font-bold text-base-content">
            <Conditional condition={project.hasMetrics}>
              <td></td>
            </Conditional>
            <td class="text-left whitespace-nowrap" data-testid="summary-label">Project Summary</td>
            <td class="text-left whitespace-nowrap"></td>
            <Conditional condition={project.hasMetrics}>
              <td class="text-right whitespace-nowrap"
                  data-testid="summary-input-tokens">{formatNumber(metrics.inputTokens)}</td>
              <td class="text-right whitespace-nowrap"
                  data-testid="summary-output-tokens">{formatNumber(metrics.outputTokens)}</td>
              <td class="text-right whitespace-nowrap"
                  data-testid="summary-cache-tokens">{formatNumber(metrics.cacheTokens)}</td>
              <td class="text-right whitespace-nowrap" data-testid="summary-cost">{metrics.cost.toFixed(2)}</td>
            </Conditional>
            <td class="text-right whitespace-nowrap"
                data-testid="summary-total-time">{formatSeconds(metrics.time / 1000)}</td>
            <td class="text-right whitespace-nowrap"></td>
            <td class="text-left whitespace-nowrap"></td>
            <td class="text-left whitespace-nowrap"></td>
          </tr>
          </tfoot>
        </table>

        <div id="compareModal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
          <div class="bg-base-100 w-[95vw] h-[90vh] rounded-lg shadow-lg relative p-4" role="dialog" aria-modal="true">
            <button id="closeCompareModal" class="btn btn-sm btn-circle absolute right-3 top-3" aria-label="Close">✕
            </button>
            <div class="mb-3 flex items-center gap-4">
              <span class="font-semibold">Metric:</span>
              <div class="join" role="group" aria-label="Metric selection">
                <Conditional condition={project.hasMetrics}>
                  <button type="button" class="btn btn-sm join-item metric-btn" data-metric="input"
                          aria-pressed="false">Input Tokens
                  </button>
                  <button type="button" class="btn btn-sm join-item metric-btn" data-metric="output"
                          aria-pressed="false">Output Tokens
                  </button>
                  <button type="button" class="btn btn-sm join-item metric-btn" data-metric="cache"
                          aria-pressed="false">Cache Tokens
                  </button>
                  <button type="button" class="btn btn-sm join-item metric-btn" data-metric="cost"
                          aria-pressed="false">Cost
                  </button>
                </Conditional>
                <button type="button" class="btn btn-sm join-item metric-btn" data-metric="time"
                        aria-pressed={project.hasMetrics ? 'false' : 'true'}>Time
                </button>
              </div>
            </div>
            <div class="h-[80%]">
              <canvas id="compareChart" class="w-full h-full"></canvas>
            </div>
          </div>
        </div>
      </div>
      <script src="/js/issueSearch.js"></script>
    </div>
  )
}