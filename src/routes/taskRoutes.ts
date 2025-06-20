import express from 'express'
import fs from "fs-extra"
import { marked } from 'marked'
import path from "path"
import { JetBrains } from "../jetbrains.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { calculateStepSummary } from '../utils/metricsUtils.js'
import { formatMilliseconds, formatSeconds } from '../utils/timeUtils.js'
import { Step } from "../Step.js"

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
router.get('/project/:projectName/issue/:issueId/task/:taskId', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)
    const task = issue?.getTaskById(taskId)

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
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task ${task.id} Steps</title>
        <link rel="stylesheet" href="/css/style.css">
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
      <body>
        <div class="container">
          <div class="header-container">
            <h1>Junie Explorer: Task ${task.id}</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb" data-testi="breadcrumb-navigation">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/" data-testid="breadcrumb-projects">Projects</a></li>
              <li class="breadcrumb-item"><a href="/project/${encodeURIComponent(projectName)}" data-testid="breadcrumb-project-name">${projectName}</a></li>
              <li class="breadcrumb-item"><a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}" data-testid="breadcrumb-task-name">${issue?.name}</a></li>
              <li class="breadcrumb-item active">Task ${task.id}</li>
            </ol>
          </nav>

          <div class="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="ide-icon" />
            `).join('')}
          </div>

          <div class="task-details">
            <div class="task-meta">
              <div class="task-created">Created: ${new Date(task.created).toLocaleString()}</div>
            </div>
            <div class="task-content-container${(!task.plan || task.plan.length === 0) ? ' no-plan' : ''}">
              ${task.context.description ? `
                <div class="task-description">
                  <h3>User</h3>
                  ${marked(escapeHtml(task.context.description))}</div>
              ` : ''}
              ${task.plan && task.plan.length > 0 ? `
                <div class="task-plan">
                  <h3>Agent</h3>
                  <div class="plan-content">
                    ${marked(escapeHtml(task.plan.map(planItem => planItem.description).join('\n\n')))}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          ${task.steps.size > 0
      ? `<div class="graph-container">
                <canvas id="stepMetricsChart"></canvas>
              </div>`
      : ''
    }

          ${task.steps.size > 0
      ? `
              <table class="steps-table">
                <thead>
                  <tr>
                    <th rowspan="2">Step</th>
                    <th colspan="3">Tokens</th>
                    <th colspan="2">Costs</th>
                    <th colspan="4">Time</th>
                    <th colspan="2">Requests</th>
                  </tr>
                  <tr>
                    ${metricsHeaders}
                  </tr>
                </thead>
                <tbody>
                  ${[...task.steps.values()].map((step) => `
                    <tr>
                      <td>
                        <div class="title-container">
                          ${step.id}
                          <button class="toggle-raw-data" data-step="${step.id}">JSON</button>
                          <button class="toggle-rep-data" data-step="${step.id}">REP</button>
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
                    <tr id="raw-data-${step.id}" class="raw-data-row" style="display: none;">
                      <td colspan="12" class="raw-data-container">
                        <div id="json-renderer-${step.id}" class="json-renderer"></div>
                      </td>
                    </tr>
                    <tr id="rep-data-${step.id}" class="rep-data-row" style="display: none;">
                      <td colspan="12" class="rep-data-container">
                        <div id="rep-renderer-${step.id}" class="rep-renderer"></div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>${summaryData.inputTokens}</strong></td>
                    <td><strong>${summaryData.outputTokens}</strong></td>
                    <td><strong>${summaryData.cacheTokens}</strong></td>
                    <td><strong>${summaryData.cost.toFixed(4)}</strong></td>
                    <td><strong>${summaryData.cachedCost.toFixed(4)}</strong></td>
                    <td><strong>${formatSeconds(summaryData.buildTime)}</strong></td>
                    <td><strong>${formatSeconds(summaryData.artifactTime)}</strong></td>
                    <td><strong>${formatMilliseconds(summaryData.modelTime)}</strong></td>
                    <td><strong>${summaryData.modelCachedTime.toFixed(2)}s</strong></td>
                    <td><strong>${summaryData.requests}</strong></td>
                    <td><strong>${summaryData.cachedRequests}</strong></td>
                  </tr>
                </tfoot>
              </table>
            `
      : '<p>No steps found for this task</p>'
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

// API endpoint to get step data for a specific task
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/step/:stepIndex', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId, stepIndex } = req.params
    const project = jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)
    const task = issue?.getTaskById(taskId)
    const step = task?.getStepById(parseInt(stepIndex, 10))

    if (!project || !issue || !task || !step) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Return only the data needed for the JSON viewer
    res.json(step)
  } catch (error) {
    console.error('Error fetching step data:', error)
    res.status(500).json({ error: 'An error occurred while fetching step data' })
  }
})

// API endpoint to get representations for a specific step
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/step/:stepIndex/representations', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId, stepIndex } = req.params
    const project = jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)
    const task = issue?.getTaskById(taskId)
    const step = task?.getStepById(parseInt(stepIndex, 10))

    if (!project || !issue || !task || !step) {
      return res.status(404).send('Step not found')
    }

    const root = path.join(step.logPath, '../../representations', task.id, `step_${step.id.toString().padStart(2, '0')}.*{swe,chat}_next*`)
    const files = fs.globSync(root)

    if (files.length === 0) {
      return res.status(404).send('No representation files found')
    }

    if (files.length > 1) {
      return res.status(400).send('More than one representation file found')
    }

    try {
      const content = fs.readFileSync(files[0], 'utf-8')
      /**
       * the content has an XML like structure, and within each element tends to be markdown
       * except in the case of the 'command' tag, where it is markdown with malformed JSON.
       *
       * Here we split out what we can so that we can give it a more elegant formatting.
       */

      type ThoughtContent = Record<string, string | undefined>

      const extractTagContent = (content: string, tag: string): string | undefined => {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's')
        const match = content.match(regex)
        return match ? match[1].trim() : undefined
      }

      const splitPattern = /(?<thought>[\s\S]*?)^-{8,}$\n(?<result>[\s\S]*)/m
      const contentParts = content.match(splitPattern)

      const thoughtContent = contentParts?.groups?.thought || content
      const resultContent = contentParts?.groups?.result || ''

      const parsedContent: ThoughtContent = {
        ['Previous Step']: extractTagContent(thoughtContent, 'PREVIOUS_STEP'),
        Plan: extractTagContent(thoughtContent, 'PLAN'),
        Command: extractTagContent(thoughtContent, 'COMMAND'),
      }

      const htmlContent = `
        <div class="thought-section">
          ${Object.keys(parsedContent).some(key => parsedContent[key as keyof ThoughtContent])
        ? Object.entries(parsedContent)
          .filter(([_, value]) => value)
          .map(([key, value]) => `
                  <div class="parsed-section">
                    <h3>${key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                    ${key === 'Command'
            ? `<pre><code>${escapeHtmlExceptCodeBlocks(value!)}</code></pre>`
            : marked(escapeHtmlExceptCodeBlocks(value!))}
                  </div>
                `).join('')
        : marked(escapeHtmlExceptCodeBlocks(thoughtContent))
      }
        </div>
        ${resultContent ? `
          <div class="result-section">
            <h3>Result</h3>
            ${marked(escapeHtmlExceptCodeBlocks(resultContent))}
          </div>
        ` : ''}
      `

      res.setHeader('Content-Type', 'text/html')
      res.send(htmlContent)
    } catch (error) {
      console.error('Error reading representation file:', error)
      res.status(500).send('Error reading representation file')
    }
  } catch (error) {
    console.error('Error fetching step representations:', error)
    res.status(500).send('An error occurred while fetching step representations')
  }
})

/**
 * Escapes HTML special characters in a given string, except for content wrapped in
 * code blocks (```...```) or inline code spans (`...`). This ensures that code blocks
 * and inline codes are preserved as-is, while other content is made safe for use in HTML.
 * Special handling is provided for Command content which gets wrapped in code tags.
 *
 * @param {string} markdown - The input string which may contain raw HTML and markdown with code blocks.
 * @return {string} A string where HTML special characters are escaped, except within code blocks and inline code spans.
 */
function escapeHtmlExceptCodeBlocks(markdown: string): string {
  // Regex to find code blocks and codespans
  // (```...``` for block, `...` for inline)
  // This is a simplified regex and might not catch all edge cases or nested blocks perfectly
  const codeBlockRegex = /(```[\s\S]*?```)|(`[^`]*?`)/g

  let lastIndex = 0
  let result = ''
  let match

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const codeBlockContent = match[0]
    const codeBlockStart = match.index
    const codeBlockEnd = match.index + codeBlockContent.length

    // Process text *before* the current code block
    const textBeforeCode = markdown.substring(lastIndex, codeBlockStart)
    result += textBeforeCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // Add the code block as-is (marked will handle it, and we don't want to escape)
    result += codeBlockContent
    lastIndex = codeBlockEnd
  }

  // Process any remaining text after the last code block
  result += markdown
    .substring(lastIndex)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return result
}

export default router
