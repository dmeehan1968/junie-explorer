import express from 'express'
import { Issue } from "../Issue.js"
import { JetBrains } from "../jetbrains.js"
import { Project } from "../Project.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { formatElapsedTime, formatNumber, formatSeconds } from '../utils/timeUtils.js'
import { VersionBanner } from '../utils/versionBanner.js'
import { ReloadButton } from '../utils/reloadButton.js'
import { Breadcrumb } from '../utils/breadcrumb.js'

const router = express.Router()

// Function to generate colored status badge based on issue state
const getStatusBadge = (state: string): string => {
  const lowerState = state.toLowerCase()
  
  // Map states to colors based on original CSS
  const stateStyles: { [key: string]: string } = {
    'done': 'bg-green-100 text-green-700 border border-green-200',
    'completed': 'bg-green-100 text-green-700 border border-green-200',
    'finished': 'bg-teal-100 text-teal-700 border border-teal-200',
    'stopped': 'bg-red-100 text-red-800 border border-red-400',
    'failed': 'bg-red-200 text-red-500 border border-red-200',
    'in-progress': 'bg-blue-100 text-blue-700 border border-blue-200',
    'running': 'bg-blue-100 text-blue-700 border border-blue-200',
    'new': 'bg-yellow-100 text-orange-600 border border-yellow-200',
    'declined': 'bg-gray-100 text-gray-600 border border-gray-200'
  }
  
  const styleClass = stateStyles[lowerState] || stateStyles[lowerState.replace(/\s+/g, '-')] || 'bg-gray-100 text-gray-600 border border-gray-200'
  
  return `<span class="inline-block px-2 py-1 text-xs font-bold rounded ${styleClass} whitespace-nowrap">${state}</span>`
}

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
  <div class="mb-5 bg-gray-100 rounded shadow-sm p-4">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold text-primary">${issuesCount} Project Issue${issuesCount !== 1 ? 's' : ''}</h3>
      <span class="font-bold text-base-content" data-testid="summary-elapsed-time">Elapsed Time: ${formatElapsedTime(elapsedTimeSec)}</span>
    </div>
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full bg-white" data-testid="issues-table">
        <thead>
          <tr class="!bg-gray-200">
            <th class="text-left w-2/5 whitespace-nowrap">Issue Description</th>
            <th class="text-left whitespace-nowrap">Timestamp</th>
            <th class="text-right whitespace-nowrap">Input Tokens</th>
            <th class="text-right whitespace-nowrap">Output Tokens</th>
            <th class="text-right whitespace-nowrap">Cache Tokens</th>
            <th class="text-right whitespace-nowrap">Cost</th>
            <th class="text-right whitespace-nowrap">Time</th>
            <th class="text-right whitespace-nowrap">Status</th>
          </tr>
          <tr class="!bg-gray-100 font-bold text-black">
            <td class="text-left whitespace-nowrap" data-testid="header-summary-label">Project Summary</td>
            <td class="text-left whitespace-nowrap"></td>
            <td class="text-right whitespace-nowrap" data-testid="header-summary-input-tokens">${formatNumber(metrics.inputTokens)}</td>
            <td class="text-right whitespace-nowrap" data-testid="header-summary-output-tokens">${formatNumber(metrics.outputTokens)}</td>
            <td class="text-right whitespace-nowrap" data-testid="header-summary-cache-tokens">${formatNumber(metrics.cacheTokens)}</td>
            <td class="text-right whitespace-nowrap" data-testid="header-summary-cost">${metrics.cost.toFixed(2)}</td>
            <td class="text-right whitespace-nowrap" data-testid="header-summary-total-time">${formatSeconds(metrics.time / 1000)}</td>
            <td class="text-right whitespace-nowrap"></td>
          </tr>
        </thead>
        <tbody>
          ${(await Promise.all(sortedIssues.map(async issue => `
          <tr class="cursor-pointer hover:!bg-blue-100 transition-all duration-200 hover:translate-x-1 border-transparent hover:shadow-md" onclick="window.location.href='/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}'">
            <td class="text-left font-bold text-primary hover:text-primary-focus whitespace-normal break-words w-2/5 align-top py-3 px-2" data-testid="issue-description">
              ${escapeHtml(issue.name)}
            </td>
            <td class="text-left whitespace-nowrap" data-testid="issue-timestamp">${new Date(issue.created).toLocaleString(locale)}</td>
            <td class="text-right whitespace-nowrap" data-testid="issue-input-tokens">${formatNumber((await issue.metrics).inputTokens)}</td>
            <td class="text-right whitespace-nowrap" data-testid="issue-output-tokens">${formatNumber((await issue.metrics).outputTokens)}</td>
            <td class="text-right whitespace-nowrap" data-testid="issue-cache-tokens">${formatNumber((await issue.metrics).cacheTokens)}</td>
            <td class="text-right whitespace-nowrap" data-testid="issue-cost">${(await issue.metrics).cost.toFixed(4)}</td>
            <td class="text-right whitespace-nowrap" data-testid="issue-total-time">${formatSeconds((await issue.metrics).time / 1000)}</td>
            <td class="text-right whitespace-nowrap" data-testid="issue-status">
              ${getStatusBadge(issue.state)}
            </td>
          </tr>
          `))).join('')}
        </tbody>
        <tfoot>
          <tr class="!bg-gray-50 font-bold border-t-2 border-gray-300">
            <td class="text-left whitespace-nowrap" data-testid="summary-label">Project Summary</td>
            <td class="text-left whitespace-nowrap"></td>
            <td class="text-right whitespace-nowrap" data-testid="summary-input-tokens">${formatNumber(metrics.inputTokens)}</td>
            <td class="text-right whitespace-nowrap" data-testid="summary-output-tokens">${formatNumber(metrics.outputTokens)}</td>
            <td class="text-right whitespace-nowrap" data-testid="summary-cache-tokens">${formatNumber(metrics.cacheTokens)}</td>
            <td class="text-right whitespace-nowrap" data-testid="summary-cost">${metrics.cost.toFixed(2)}</td>
            <td class="text-right whitespace-nowrap" data-testid="summary-total-time">${formatSeconds(metrics.time / 1000)}</td>
            <td class="text-right whitespace-nowrap"></td>
          </tr>
        </tfoot>
      </table>
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
router.get('/project/:projectName', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains

  try {
    const { projectName } = req.params
    const project = await jetBrains.getProjectByName(projectName)

    if (!project) {
      return res.status(404).send('Project not found')
    }

    // Prepare graph data
    const graphData = await prepareGraphData([...(await project.issues).values()])

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en" data-theme="light">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} Issues</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        ${(await project.issues).size > 0
      ? `<script>
              // Define the chart data as a global variable
              window.chartData = ${JSON.stringify(graphData)};
            </script>`
      : ''
    }
        <script src="/js/issueGraph.js"></script>
        <script src="/js/reloadPage.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer: ${project.name}</h1>
            ${ReloadButton()}
          </div>
          ${VersionBanner(jetBrains.version)}
          ${Breadcrumb({
            items: [
              { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
              { label: project.name, testId: 'breadcrumb-project-name' }
            ]
          })}

          <div class="flex gap-2 mb-5" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
            `).join('')}
          </div>

          ${(await project.issues).size > 0
      ? `<div class="h-96 mb-5 p-4 bg-base-100 rounded-lg border border-base-300" data-testid="cost-over-time-graph">
                <canvas id="costOverTimeChart"></canvas>
              </div>`
      : ''
    }
          ${await generateIssuesTable(project, getLocaleFromRequest(req))}
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
