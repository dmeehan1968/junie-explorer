import express from 'express'
import { Issue } from "../Issue.js"
import { JetBrains } from "../jetbrains.js"
import { Project } from "../Project.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { formatElapsedTime, formatNumber, formatSeconds } from '../utils/timeUtils.js'

const router = express.Router()

// Function to generate HTML for combined issues table with project summary footer
const generateIssuesTable = (project: Project): string => {
  if (project.issues.size === 0) {
    return '<p data-testid="no-issues-message">No issues found for this project</p>'
  }

  const sortedIssues = [...project.issues.values()].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
  const oldestIssue = sortedIssues[0]
  const newestIssue = sortedIssues[sortedIssues.length - 1]
  const elapsedTimeMs = new Date(newestIssue.created).getTime() - new Date(oldestIssue.created).getTime()
  const elapsedTimeSec = elapsedTimeMs / 1000

  return `
  <div class="project-summary">
    <h3>Project Issues</h3>
    <table class="project-summary-table issues-table" data-testid="issues-table">
      <thead>
        <tr>
          <th style="text-align: left; width: 30%;">Issue Description</th>
          <th style="text-align: left;">Timestamp</th>
          <th style="text-align: right;">Input Tokens</th>
          <th style="text-align: right;">Output Tokens</th>
          <th style="text-align: right;">Cache Tokens</th>
          <th style="text-align: right;">Cost</th>
          <th style="text-align: right;">Time</th>
          <th style="text-align: right;">Status</th>
        </tr>
        <tr style="font-weight: bold; background-color: #f8f9fa;">
          <td style="text-align: left;" data-testid="header-summary-label">Project Summary</td>
          <td style="text-align: left;"></td>
          <td style="text-align: right;" data-testid="header-summary-input-tokens">${formatNumber(project.metrics.inputTokens)}</td>
          <td style="text-align: right;" data-testid="header-summary-output-tokens">${formatNumber(project.metrics.outputTokens)}</td>
          <td style="text-align: right;" data-testid="header-summary-cache-tokens">${formatNumber(project.metrics.cacheTokens)}</td>
          <td style="text-align: right;" data-testid="header-summary-cost">${project.metrics.cost.toFixed(4)}</td>
          <td style="text-align: right;" data-testid="header-summary-total-time">${formatSeconds(project.metrics.time / 1000)}</td>
          <td style="text-align: right;"></td>
        </tr>
      </thead>
      <tbody>
        ${sortedIssues.map(issue => `
        <tr>
          <td style="text-align: left;" data-testid="issue-description">
            <a href="/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}" class="issue-link" data-testid="issue-link">
              ${escapeHtml(issue.name)}
            </a>
          </td>
          <td style="text-align: left;" data-testid="issue-timestamp">${new Date(issue.created).toLocaleString()}</td>
          <td style="text-align: right;" data-testid="issue-input-tokens">${formatNumber(issue.metrics.inputTokens)}</td>
          <td style="text-align: right;" data-testid="issue-output-tokens">${formatNumber(issue.metrics.outputTokens)}</td>
          <td style="text-align: right;" data-testid="issue-cache-tokens">${formatNumber(issue.metrics.cacheTokens)}</td>
          <td style="text-align: right;" data-testid="issue-cost">${issue.metrics.cost.toFixed(4)}</td>
          <td style="text-align: right;" data-testid="issue-total-time">${formatSeconds(issue.metrics.time / 1000)}</td>
          <td style="text-align: right;" data-testid="issue-status">
            <span class="issue-state state-${issue.state.toLowerCase()}">${issue.state}</span>
          </td>
        </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight: bold; background-color: #f8f9fa;">
          <td style="text-align: left;" data-testid="summary-label">Project Summary</td>
          <td style="text-align: left;"></td>
          <td style="text-align: right;" data-testid="summary-input-tokens">${formatNumber(project.metrics.inputTokens)}</td>
          <td style="text-align: right;" data-testid="summary-output-tokens">${formatNumber(project.metrics.outputTokens)}</td>
          <td style="text-align: right;" data-testid="summary-cache-tokens">${formatNumber(project.metrics.cacheTokens)}</td>
          <td style="text-align: right;" data-testid="summary-cost">${project.metrics.cost.toFixed(4)}</td>
          <td style="text-align: right;" data-testid="summary-total-time">${formatSeconds(project.metrics.time / 1000)}</td>
          <td style="text-align: right;"></td>
        </tr>
        <tr style="font-weight: bold; background-color: #f8f9fa;">
          <td style="text-align: left;"></td>
          <td style="text-align: right;"></td>
          <td style="text-align: right;"></td>
          <td style="text-align: right;"></td>
          <td style="text-align: right;"></td>
          <td style="text-align: right;"></td>
          <td style="text-align: right;" data-testid="summary-elapsed-time">${formatElapsedTime(elapsedTimeSec)}</td>
          <td style="text-align: right;"></td>
        </tr>
      </tfoot>
    </table>
  </div>
`
}

// Function to prepare data for the cost over time graph
function prepareGraphData(issues: Issue[]): { labels: string[], datasets: any[], timeUnit: string, stepSize: number } {
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
  const datasets = sortedIssues.map((issue, index) => {

    // Generate a color based on index
    const hue = (index * 137) % 360 // Use golden ratio to spread colors
    const color = `hsl(${hue}, 70%, 60%)`

    return {
      label: issue.name,
      data: [{ x: issue.created, y: issue.metrics.cost }],
      borderColor: color,
      backgroundColor: color,
      fill: false,
      tension: 0.1,
    }
  })

  return {
    labels: [minDate.toISOString(), maxDate.toISOString()],
    datasets,
    timeUnit,
    stepSize,
  }
}

// Project issues page route
router.get('/project/:projectName', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains

  try {
    const { projectName } = req.params
    const project = jetBrains.getProjectByName(projectName)

    if (!project) {
      return res.status(404).send('Project not found')
    }

    // Prepare graph data
    const graphData = prepareGraphData([...project.issues.values()])

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} Issues</title>
        <link rel="stylesheet" href="/css/style.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        ${project.issues.size > 0
      ? `<script>
              // Define the chart data as a global variable
              window.chartData = ${JSON.stringify(graphData)};
            </script>`
      : ''
    }
        <script src="/js/issueGraph.js"></script>
        <script src="/js/reloadPage.js"></script>
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>Junie Explorer: ${project.name}</h1>
            <button id="reload-button" class="reload-button" data-testid="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb" data-testid="breadcrumb-navigation">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/" data-testid="breadcrumb-projects">Projects</a></li>
              <li class="breadcrumb-item active">${project.name}</li>
            </ol>
          </nav>

          <div class="ide-icons" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="ide-icon" />
            `).join('')}
          </div>

          ${project.issues.size > 0
      ? `<div class="graph-container" data-testid="cost-over-time-graph">
                <canvas id="costOverTimeChart"></canvas>
              </div>`
      : ''
    }

          ${generateIssuesTable(project)}
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
