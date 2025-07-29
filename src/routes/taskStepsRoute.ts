import express from 'express'
import { marked } from 'marked'
import { JetBrains } from "../jetbrains.js"
import { Step } from "../Step.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { calculateStepSummary } from '../utils/metricsUtils.js'
import { formatMilliseconds, formatSeconds } from '../utils/timeUtils.js'
import { VersionBanner } from '../utils/versionBanner.js'

const router = express.Router()

// Function to prepare data for the metrics over time graph
function prepareStepGraphData(steps: Step[]): {
  labels: string[],
  datasets: any[],
  timeUnit: string,
  stepSize: number
} {
  // Use the actual timestamps from the step data
  const stepTimes = steps.map(step => step.startTime)

  // Find min and max dates
  const minDate = stepTimes.length > 0 ? new Date(Math.min(...stepTimes.map(date => date.getTime()))) : new Date()
  const maxDate = stepTimes.length > 0 ? new Date(Math.max(...stepTimes.map(date => date.getTime()))) : new Date()

  // Calculate the date range in milliseconds
  const dateRange = maxDate.getTime() - minDate.getTime()

  // Determine the appropriate time unit based on the date range
  let timeUnit = 'minute' // default for task steps (usually short timeframe)
  let stepSize = 1

  // Constants for time calculations
  const MINUTE = 60 * 1000
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const WEEK = 7 * DAY
  const MONTH = 30 * DAY
  const YEAR = 365 * DAY

  // Minimum number of labels we want to display
  const MIN_LABELS = 5

  if (dateRange < MINUTE * 5) {
    timeUnit = 'second'
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (1000 * MIN_LABELS)))
  } else if (dateRange < HOUR) {
    timeUnit = 'minute'
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (MINUTE * MIN_LABELS)))
  } else if (dateRange < DAY) {
    timeUnit = 'hour'
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (HOUR * MIN_LABELS)))
  } else if (dateRange < WEEK) {
    timeUnit = 'day'
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (DAY * MIN_LABELS)))
  } else if (dateRange < MONTH) {
    timeUnit = 'week'
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (WEEK * MIN_LABELS)))
  } else if (dateRange < YEAR) {
    timeUnit = 'month'
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (MONTH * MIN_LABELS)))
  } else {
    timeUnit = 'year'
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (YEAR * MIN_LABELS)))
  }

  // Create datasets for cost and aggregate tokens
  const costData = steps.map(step => ({
    x: step.startTime.toISOString(),
    y: step.metrics.cost,
  }))

  const tokenData = steps.map(step => ({
    x: step.startTime.toISOString(),
    y: step.metrics.inputTokens + step.metrics.outputTokens + step.metrics.cacheTokens,
  }))

  const datasets = [
    {
      label: 'Cost',
      data: costData,
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
    },
    {
      label: 'Tokens (Input + Output + Cache)',
      data: tokenData,
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
    },
  ]

  return {
    labels: steps.map(step => step.startTime.toISOString()),
    datasets,
    timeUnit,
    stepSize,
  }
}

// Generate HTML for metrics table headers (used only for steps table, not for totals)
const metricsHeaders = `
  <th>Input</th>
  <th>Output</th>
  <th>Cache</th>
  <th>Default</th>
  <th>Cached</th>
  <th>Build</th>
  <th>Artifact</th>
  <th>Model</th>
  <th>Model Cached</th>
  <th>Default</th>
  <th>Cached</th>
`

// Task steps page route
router.get('/project/:projectName/issue/:issueId/task/:taskId', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    // Calculate summary values for the footer
    const summaryData = calculateStepSummary([...task.steps.values()])

    // Prepare graph data
    const graphData = prepareStepGraphData([...task.steps.values()])

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en" data-theme="light">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task ${task.id} Steps</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" sizes="any" type="image/png">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.css">
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.js"></script>
        ${task.steps.size > 0
      ? `<script>
              // Define the chart data as a global variable
              window.chartData = ${JSON.stringify(graphData)};
            </script>`
      : ''
    }
        <script src="/js/taskStepGraph.js"></script>
        <script src="/js/taskStepRawData.js"></script>
        <script src="/js/taskStepRepData.js"></script>
        <script src="/js/reloadPage.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer: Task ${task.id}</h1>
            <button id="reload-button" class="btn btn-primary btn-sm" onclick="reloadPage()">Reload</button>
          </div>
          ${VersionBanner(jetBrains.version)}
          <nav aria-label="breadcrumb" data-testi="breadcrumb-navigation">
            <div class="breadcrumbs mb-5">
              <ul>
                <li><a href="/" data-testid="breadcrumb-projects" class="text-primary hover:text-primary-focus">Projects</a></li>
                <li><a href="/project/${encodeURIComponent(projectName)}" data-testid="breadcrumb-project-name" class="text-primary hover:text-primary-focus">${projectName}</a></li>
                <li><a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}" data-testid="breadcrumb-task-name" class="text-primary hover:text-primary-focus">${issue?.name}</a></li>
                <li class="text-base-content/70">Task ${task.id}</li>
              </ul>
            </div>
          </nav>

          <div class="flex gap-1 mb-5">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-6 h-6" />
            `).join('')}
          </div>

          <div class="mb-5">
            <div class="mb-3">
              <div class="text-sm text-base-content/70">Created: ${new Date(task.created).toLocaleString(getLocaleFromRequest(req))}</div>
            </div>
            <div class="grid gap-4 ${(!task.plan || task.plan.length === 0) ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}">
              ${task.context.description ? `
                <div class="bg-base-200 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold mb-2 text-primary">User</h3>
                  <div class="prose prose-sm max-w-none">${marked(escapeHtml(task.context.description))}</div>
                </div>
              ` : ''}
              ${task.plan && task.plan.length > 0 ? `
                <div class="bg-base-200 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold mb-2 text-primary">Agent</h3>
                  <div class="prose prose-sm max-w-none">
                    ${marked(escapeHtml(task.plan.map(planItem => planItem.description).join('\n\n')))}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          ${task.steps.size > 0
      ? `<div class="h-96 mb-5 p-4 bg-base-100 rounded-lg border border-base-300">
                <canvas id="stepMetricsChart"></canvas>
              </div>`
      : ''
    }

          ${task.steps.size > 0
      ? `
              <div class="overflow-x-auto">
                <table class="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th rowspan="2" class="bg-base-200">Step</th>
                      <th colspan="3" class="bg-base-200 text-center">Tokens</th>
                      <th colspan="2" class="bg-base-200 text-center">Costs</th>
                      <th colspan="4" class="bg-base-200 text-center">Time</th>
                      <th colspan="2" class="bg-base-200 text-center">Requests</th>
                    </tr>
                    <tr>
                      ${metricsHeaders}
                    </tr>
                  </thead>
                <tbody>
                  ${[...task.steps.values()].map((step) => `
                    <tr>
                      <td>
                        <div class="flex items-center gap-2">
                          <span class="font-medium">${step.id}</span>
                          <button class="btn btn-xs bg-gray-200 border-gray-400 text-gray-600 toggle-json-data" data-step="${step.id}">JSON</button>
                          <button class="btn btn-xs bg-gray-200 border-gray-400 text-gray-600 toggle-rep-data" data-step="${step.id}">REP</button>
                        </div>
                      </td>
                      <td>${step.metrics.inputTokens}</td>
                      <td>${step.metrics.outputTokens}</td>
                      <td>${step.metrics.cacheTokens}</td>
                      <td>${step.metrics.cost.toFixed(4)}</td>
                      <td>${step.metrics.cachedCost.toFixed(4)}</td>
                      <td>${step.metrics.buildTime.toFixed(2)}s</td>
                      <td>${step.metrics.artifactTime.toFixed(2)}s</td>
                      <td>${formatMilliseconds(step.metrics.modelTime)}</td>
                      <td>${step.metrics.modelCachedTime.toFixed(2)}s</td>
                      <td>${step.metrics.requests}</td>
                      <td>${step.metrics.cachedRequests}</td>
                    </tr>
                    <tr id="raw-data-${step.id}" class="hidden">
                      <td colspan="12" class="p-4 bg-base-200">
                        <div id="json-renderer-${step.id}" class="bg-base-100 p-4 rounded border overflow-auto max-h-96 font-mono text-xs leading-relaxed"></div>
                      </td>
                    </tr>
                    <tr id="rep-data-${step.id}" class="hidden">
                      <td colspan="12" class="p-4 bg-base-200">
                        <div id="rep-renderer-${step.id}" class="bg-base-100 p-4 rounded border overflow-auto max-h-96 max-w-none prose"></div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="bg-base-300 font-bold">
                    <td class="font-bold">Total</td>
                    <td class="font-bold">${summaryData.inputTokens}</td>
                    <td class="font-bold">${summaryData.outputTokens}</td>
                    <td class="font-bold">${summaryData.cacheTokens}</td>
                    <td class="font-bold">${summaryData.cost.toFixed(4)}</td>
                    <td class="font-bold">${summaryData.cachedCost.toFixed(4)}</td>
                    <td class="font-bold">${formatSeconds(summaryData.buildTime)}</td>
                    <td class="font-bold">${formatSeconds(summaryData.artifactTime)}</td>
                    <td class="font-bold">${formatMilliseconds(summaryData.modelTime)}</td>
                    <td class="font-bold">${summaryData.modelCachedTime.toFixed(2)}s</td>
                    <td class="font-bold">${summaryData.requests}</td>
                    <td class="font-bold">${summaryData.cachedRequests}</td>
                  </tr>
                </tfoot>
                </table>
              </div>
            `
      : '<p class="text-center text-base-content/70 p-4">No steps found for this task</p>'
    }
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating steps page:', error)
    res.status(500).send('An error occurred while generating the steps page')
  }
})

export default router