import express from 'express'
import { entityLookupMiddleware } from "../middleware/entityLookupMiddleware.js"
import { AppRequest, AppResponse } from "../types.js"
import { Issue } from "../../Issue.js"
import { Project } from "../../Project.js"
import { Breadcrumb } from '../../components/breadcrumb.js'
import { escapeHtml } from "../../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../../utils/getLocaleFromRequest.js"
import { ReloadButton } from '../../components/reloadButton.js'
import { StatusBadge } from "../../components/statusBadge.js"
import { formatElapsedTime, formatNumber, formatSeconds } from '../../utils/timeUtils.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { VersionBanner } from '../../components/versionBanner.js'
import { themeAttributeForHtml } from '../../utils/themeCookie.js'

const router = express.Router({ mergeParams: true })

router.use('/project/:projectId', entityLookupMiddleware)

// Function to generate HTML for combined issues table with project summary footer
const generateIssuesTable = async (project: Project, locale: string | undefined): Promise<string> => {
  const issuesCount = (await project.issues).size

  if (issuesCount === 0) {
    return '<p class="p-4 text-center text-base-content/70" data-testid="no-issues-message">No issues found for this project</p>'
  }

  const sortedIssues = [...(await project.issues).values()].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  const oldestIssue = sortedIssues[sortedIssues.length - 1]
  const newestIssue = sortedIssues[0]
  const elapsedTimeMs = new Date(newestIssue.created).getTime() - new Date(oldestIssue.created).getTime()
  const elapsedTimeSec = elapsedTimeMs / 1000
  const metrics = await project.metrics
  return `
  <div class="mb-5 bg-base-200 rounded shadow-sm p-4">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold text-primary">${issuesCount} Project Issue${issuesCount !== 1 ? 's' : ''}</h3>
      <span class="font-bold text-base-content" data-testid="summary-elapsed-time">Elapsed Time: ${formatElapsedTime(elapsedTimeSec)}</span>
    </div>
    <div class="overflow-x-auto">
      ${!project.hasMetrics 
        ? `
          <div class="bg-base-content/10 p-4 rounded mb-4">
            This project does not contain token or cost metrics, which means that it is most likely created by the 
            Junie General Availability (GA) plugin which does not collect metrics.
          </div>
        `
        : ``
      }
      ${project.hasMetrics 
        ? `<div class="flex items-center justify-between mb-3">
        <div class="text-sm opacity-70">Select at least two issues to enable compare</div>
        <button id="compareBtn" class="btn btn-primary btn-sm" disabled data-testid="compare-button">Compare</button>
      </div>`
        : ``
      }
      <table class="table table-zebra w-full bg-base-100" data-testid="issues-table">
        <thead>
          <tr class="!bg-base-200">
            ${project.hasMetrics ? `<th class="w-10 text-center align-middle"><input type="checkbox" id="selectAllIssues" class="checkbox checkbox-sm" aria-label="Select all issues" /></th>` : ''}
            <th class="text-left w-2/5 whitespace-nowrap">Issue Description</th>
            <th class="text-left whitespace-nowrap">Timestamp</th>
            ${project.hasMetrics 
              ? `<th class="text-right whitespace-nowrap">Input Tokens</th>
                <th class="text-right whitespace-nowrap">Output Tokens</th>
                <th class="text-right whitespace-nowrap">Cache Tokens</th>
                <th class="text-right whitespace-nowrap">Cost</th>
               ` 
              : ''}
            <th class="text-right whitespace-nowrap">Time</th>
            <th class="text-right whitespace-nowrap">Status</th>
          </tr>
          <tr class="!bg-base-200 font-bold text-base-content">
            ${project.hasMetrics ? '<td></td>' : ''}
            <td class="text-left whitespace-nowrap" data-testid="header-summary-label">Project Summary</td>
            <td class="text-left whitespace-nowrap"></td>
            ${project.hasMetrics
              ? `
                <td class="text-right whitespace-nowrap" data-testid="header-summary-input-tokens">${formatNumber(metrics.inputTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="header-summary-output-tokens">${formatNumber(metrics.outputTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="header-summary-cache-tokens">${formatNumber(metrics.cacheTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="header-summary-cost">${metrics.cost.toFixed(2)}</td>
              `
              : ``
            }
            <td class="text-right whitespace-nowrap" data-testid="header-summary-total-time">${formatSeconds(metrics.time / 1000)}</td>
            <td class="text-right whitespace-nowrap"></td>
          </tr>
        </thead>
        <tbody>
          ${(await Promise.all(sortedIssues.map(async issue => {
            const tasks = await issue.tasks
            const hasTasks = tasks.size > 0
            const href = hasTasks
              ? `/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}/task/0/trajectories`
              : `/project/${encodeURIComponent(project.name)}`
            return `
          <tr class="cursor-pointer hover:!bg-accent transition-all duration-200 hover:translate-x-1 border-transparent hover:shadow-md">
            ${project.hasMetrics ? `
            <td class="text-center align-top py-3 px-2">
              <input type="checkbox" class="checkbox checkbox-sm issue-select" aria-label="Select issue for comparison" 
                data-issue-id="${escapeHtml(issue.id)}"
                data-issue-name="${escapeHtml(issue.name)}"
                data-input-tokens="${(await issue.metrics).inputTokens}"
                data-output-tokens="${(await issue.metrics).outputTokens}"
                data-cache-tokens="${(await issue.metrics).cacheTokens}"
                data-cost="${(await issue.metrics).cost}"
                data-time-ms="${(await issue.metrics).time}"
                onclick="event.stopPropagation()"
              />
            </td>
            ` : ``}
            <td class="text-left whitespace-normal break-words w-2/5 align-top py-3 px-2" data-testid="issue-description" role="link" tabindex="0" onclick="window.location.href='${href}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}">
              <span class="font-bold text-primary">
                ${escapeHtml(issue.name)}
              </span>
              <span class="text-neutral/50">${tasks.size > 1 ? `(${tasks.size})` : ''}</span>
            </td>
            <td class="text-left whitespace-nowrap" data-testid="issue-timestamp" role="link" tabindex="0" onclick="window.location.href='${href}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}">
              ${new Date(issue.created).toLocaleString(locale)}
            </td>
            ${project.hasMetrics 
              ? `
                <td class="text-right whitespace-nowrap" data-testid="issue-input-tokens" role="link" tabindex="0" onclick="window.location.href='${href}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}">
                  ${formatNumber((await issue.metrics).inputTokens)}
                </td>
                <td class="text-right whitespace-nowrap" data-testid="issue-output-tokens" role="link" tabindex="0" onclick="window.location.href='${href}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}">
                  ${formatNumber((await issue.metrics).outputTokens)}
                </td>
                <td class="text-right whitespace-nowrap" data-testid="issue-cache-tokens" role="link" tabindex="0" onclick="window.location.href='${href}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}">
                  ${formatNumber((await issue.metrics).cacheTokens)}
                </td>
                <td class="text-right whitespace-nowrap" data-testid="issue-cost" role="link" tabindex="0" onclick="window.location.href='${href}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}">
                  ${(await issue.metrics).cost.toFixed(4)}
                </td>
              ` 
              : ``
            }
            <td class="text-right whitespace-nowrap" data-testid="issue-total-time" role="link" tabindex="0" onclick="window.location.href='${href}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}">
              ${formatSeconds((await issue.metrics).time / 1000)}
            </td>
            <td class="text-right whitespace-nowrap" data-testid="issue-status" role="link" tabindex="0" onclick="window.location.href='${href}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}">
              ${StatusBadge({ state: issue.state })}
            </td>
          </tr>
          `
          }))).join('')}
        </tbody>
        <tfoot>
          <tr class="!bg-base-200 font-bold text-base-content">
            ${project.hasMetrics ? '<td></td>' : ''}
            <td class="text-left whitespace-nowrap" data-testid="summary-label">Project Summary</td>
            <td class="text-left whitespace-nowrap"></td>
            ${project.hasMetrics 
              ? `
                <td class="text-right whitespace-nowrap" data-testid="summary-input-tokens">${formatNumber(metrics.inputTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="summary-output-tokens">${formatNumber(metrics.outputTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="summary-cache-tokens">${formatNumber(metrics.cacheTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="summary-cost">${metrics.cost.toFixed(2)}</td>
              `
              : ``
            }
            <td class="text-right whitespace-nowrap" data-testid="summary-total-time">${formatSeconds(metrics.time / 1000)}</td>
            <td class="text-right whitespace-nowrap"></td>
          </tr>
        </tfoot>
      </table>

      <!-- Compare Modal -->
      <div id="compareModal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
        <div class="bg-base-100 w-[95vw] h-[90vh] rounded-lg shadow-lg relative p-4" role="dialog" aria-modal="true">
          <button id="closeCompareModal" class="btn btn-sm btn-circle absolute right-3 top-3" aria-label="Close">✕</button>
          <div class="mb-3 flex items-center gap-4">
            <span class="font-semibold">Metric:</span>
            <div class="join" role="group" aria-label="Metric selection">
              ${project.hasMetrics ? `
                <button type="button" class="btn btn-sm join-item metric-btn" data-metric="input" aria-pressed="false">Input Tokens</button>
                <button type="button" class="btn btn-sm join-item metric-btn" data-metric="output" aria-pressed="false">Output Tokens</button>
                <button type="button" class="btn btn-sm join-item metric-btn" data-metric="cache" aria-pressed="false">Cache Tokens</button>
                <button type="button" class="btn btn-sm join-item metric-btn" data-metric="cost" aria-pressed="false">Cost</button>
              ` : ''}
              <button type="button" class="btn btn-sm join-item metric-btn" data-metric="time" aria-pressed="${project.hasMetrics ? 'false' : 'true'}">Time</button>
            </div>
          </div>
          <div class="h-[80%]"><canvas id="compareChart" class="w-full h-full"></canvas></div>
        </div>
      </div>
    </div>
  </div>
`
}

// Function to prepare data for the cost over time graph
async function prepareGraphData(issues: Issue[]): Promise<{ labels: string[], datasets: any[], timeUnit: string, stepSize: number }> {
  // Sort issues by creation date
  const sortedIssues = [...issues].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())

  // Find min and max dates
  const minDate = sortedIssues.length > 0 ? new Date(sortedIssues[0].created) : new Date()
  const maxDate = sortedIssues.length > 0 ? new Date(sortedIssues[sortedIssues.length - 1].created) : new Date()

  // Calculate the date range in milliseconds
  const dateRange = maxDate.getTime() - minDate.getTime()

  // Determine the appropriate time unit based on the date range
  let timeUnit = 'day' // default
  let stepSize = 1

  // Constants for time calculations
  const HOUR = 60 * 60 * 1000
  const DAY = 24 * HOUR
  const WEEK = 7 * DAY
  const MONTH = 30 * DAY
  const YEAR = 365 * DAY

  if (dateRange < DAY) {
    timeUnit = 'hour'
  } else if (dateRange < DAY * 2) {
    timeUnit = 'hour'
    stepSize = 3
  } else if (dateRange < WEEK * 4) {
    timeUnit = 'day'
  } else if (dateRange < MONTH * 6) {
    timeUnit = 'week'
  } else if (dateRange < YEAR) {
    timeUnit = 'month'
  } else {
    timeUnit = 'year'
  }

  // Create datasets for each issue
  const datasets = await Promise.all(sortedIssues.map(async (issue, index) => {

    // Generate a color based on index
    const hue = (index * 137) % 360 // Use golden ratio to spread colors
    const color = `hsl(${hue}, 70%, 60%)`

    return {
      label: issue.name,
      data: [{ x: issue.created, y: (await issue.metrics).cost }],
      borderColor: color,
      backgroundColor: color,
      fill: false,
      tension: 0.1,
    }
  }))

  return {
    labels: [minDate.toISOString(), maxDate.toISOString()],
    datasets,
    timeUnit,
    stepSize,
  }
}

// Project issues page route
router.get('/project/:projectId', async (req: AppRequest, res: AppResponse) => {

  try {
    const { jetBrains, project } = req
    const issues = [...(await project?.issues ?? []).values()]

    // Prepare graph data
    const graphData = await prepareGraphData(issues)

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en" ${themeAttributeForHtml(req.headers.cookie)}>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Junie Explorer: ${project?.name} Issues</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        ${issues.length > 0
      ? `<script>
              // Define the chart data as a global variable
              window.chartData = ${JSON.stringify(graphData)};
            </script>`
      : ''
    }
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/issueGraph.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/compareModal.js"></script>
      </head>
      <body class="bg-base-200 p-5" data-project-id="${escapeHtml(project?.name ?? '')}">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer: ${project?.name}</h1>
            <div class="flex items-center gap-3">
              ${ThemeSwitcher({})}
              ${ReloadButton({})}
            </div>
          </div>
          ${VersionBanner({ version: jetBrains?.version})}
          ${Breadcrumb({
            items: [
              { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
              { label: project?.name ?? '', testId: 'breadcrumb-project-name' }
            ]
          })}

          <div class="flex gap-2 mb-5" data-testid="ide-icons">
            ${project?.ideNames.map(ide => `
              <img src="${jetBrains?.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
            `).join('')}
          </div>

          ${project!.hasMetrics
      ? `<div class="h-96 mb-5 p-4 bg-base-200 rounded-lg border border-base-300" data-testid="cost-over-time-graph">
                <canvas id="costOverTimeChart"></canvas>
              </div>`
      : ''
    }
          ${project && await generateIssuesTable(project, getLocaleFromRequest(req))}
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating issues page:', error)
    res.status(500).send('An error occurred while generating the issues page')
  }
})

export default router
