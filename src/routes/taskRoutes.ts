import express from 'express'
import { marked } from 'marked'
import { EventRecord } from '../eventSchema.js'
import { JetBrains } from "../jetbrains.js"
import { RepresentationService } from '../services/representationService.js'
import { Step } from "../Step.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { calculateStepSummary } from '../utils/metricsUtils.js'
import { formatMilliseconds, formatSeconds } from '../utils/timeUtils.js'

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

// Function to prepare data for the LLM events metrics over time graph
function prepareLlmEventGraphData(events: EventRecord[]): {
  labels: string[],
  datasets: any[],
  timeUnit: string,
  stepSize: number,
  providers: string[]
} {
  // Filter for LlmResponseEvent events only
  const llmEvents = events.filter(event => event.event.type === 'LlmResponseEvent')

  if (llmEvents.length === 0) {
    return {
      labels: [],
      datasets: [],
      timeUnit: 'minute',
      stepSize: 1,
      providers: [],
    }
  }

  // Extract unique providers
  const providers = [...new Set(llmEvents.map(event => (event.event as any).answer.llm.provider))].sort()

  // Use the actual timestamps from the event data
  const eventTimes = llmEvents.map(event => event.timestamp)

  // Find min and max dates
  const minDate = eventTimes.length > 0 ? new Date(Math.min(...eventTimes.map(date => date.getTime()))) : new Date()
  const maxDate = eventTimes.length > 0 ? new Date(Math.max(...eventTimes.map(date => date.getTime()))) : new Date()

  // Calculate the date range in milliseconds
  const dateRange = maxDate.getTime() - minDate.getTime()

  // Determine the appropriate time unit based on the date range
  let timeUnit = 'minute' // default for events (usually short timeframe)
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
    stepSize = Math.max(1, Math.floor(dateRange / (1000 * MIN_LABELS)))
  } else if (dateRange < HOUR) {
    timeUnit = 'minute'
    stepSize = Math.max(1, Math.floor(dateRange / (MINUTE * MIN_LABELS)))
  } else if (dateRange < DAY) {
    timeUnit = 'hour'
    stepSize = Math.max(1, Math.floor(dateRange / (HOUR * MIN_LABELS)))
  } else if (dateRange < WEEK) {
    timeUnit = 'day'
    stepSize = Math.max(1, Math.floor(dateRange / (DAY * MIN_LABELS)))
  } else if (dateRange < MONTH) {
    timeUnit = 'week'
    stepSize = Math.max(1, Math.floor(dateRange / (WEEK * MIN_LABELS)))
  } else if (dateRange < YEAR) {
    timeUnit = 'month'
    stepSize = Math.max(1, Math.floor(dateRange / (MONTH * MIN_LABELS)))
  } else {
    timeUnit = 'year'
    stepSize = Math.max(1, Math.floor(dateRange / (YEAR * MIN_LABELS)))
  }

  // Create datasets for cost and aggregate tokens
  const costData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: (event.event as any).answer.cost,
  }))

  const tokenData = llmEvents.map(event => {
    const answer = (event.event as any).answer
    return {
      x: event.timestamp.toISOString(),
      y: answer.inputTokens + answer.outputTokens + answer.cacheCreateInputTokens,
    }
  })

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
    labels: llmEvents.map(event => event.timestamp.toISOString()),
    datasets,
    timeUnit,
    stepSize,
    providers,
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
                          <button class="toggle-json-data" data-step="${step.id}">JSON</button>
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
                    <tr id="raw-data-${step.id}" class="raw-data-row">
                      <td colspan="12" class="raw-data-container">
                        <div id="json-renderer-${step.id}" class="json-renderer"></div>
                      </td>
                    </tr>
                    <tr id="rep-data-${step.id}" class="rep-data-row">
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
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/step/:stepIndex/representations', async (req, res) => {
  try {
    const jetBrains = req.app.locals.jetBrains as JetBrains
    const { projectName, issueId, taskId, stepIndex } = req.params

    const htmlContent = await RepresentationService.getStepRepresentation(
      jetBrains,
      projectName,
      issueId,
      taskId,
      stepIndex,
    )

    res.setHeader('Content-Type', 'text/html')
    res.send(htmlContent)
  } catch (error) {
    console.error('Error fetching step representations:', error)

    if (error instanceof Error) {
      if (error.message === 'Step not found') {
        return res.status(404).send('Step not found')
      }
      if (error.message === 'No representation files found') {
        return res.status(404).send('No representation files found')
      }
      if (error.message === 'More than one representation file found') {
        return res.status(400).send('More than one representation file found')
      }
    }

    res.status(500).send('An error occurred while fetching step representations')
  }
})

// Task events page route
router.get('/project/:projectName/issue/:issueId/task/:taskId/events', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)
    const task = issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    // Get events for the task
    const events = task.events
    let cost = 0

    // Prepare LLM event graph data
    const llmGraphData = prepareLlmEventGraphData(events)
    const hasLlmEvents = llmGraphData.labels.length > 0

    // Filter and flatten action events for Action Timeline
    const actionEvents = events
      .filter(e =>
        e.event.type === 'AgentActionExecutionStarted' ||
        e.event.type === 'AgentActionExecutionFinished',
      )
      .map(e => ({
        timestamp: e.timestamp,
        eventType: e.event.type,
        actionName: e.event.type === 'AgentActionExecutionStarted'
          ? (e.event as any).actionToExecute?.name || ''
          : '',
        inputParamValue: e.event.type === 'AgentActionExecutionStarted'
          ? ((e.event as any).actionToExecute?.inputParams?.[0]?.value?.toString() || '')
          : '',
      }))
    const hasActionEvents = actionEvents.length > 0

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task ${task.id} Events</title>
        <link rel="stylesheet" href="/css/style.css">
        <link rel="icon" href="/icons/favicon.png" sizes="any" type="image/png">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        ${hasLlmEvents
      ? `<script>
              // Define the LLM chart data as a global variable
              window.llmChartData = ${JSON.stringify(llmGraphData)};
              // Define the LLM events data for filtering
              window.llmEvents = ${JSON.stringify(events.filter(e => e.event.type === 'LlmResponseEvent').map(e => ({
        timestamp: e.timestamp.toISOString(),
        event: {
          type: e.event.type,
          answer: {
            llm: { provider: (e.event as any).answer.llm.provider },
            cost: (e.event as any).answer.cost,
            inputTokens: (e.event as any).answer.inputTokens,
            outputTokens: (e.event as any).answer.outputTokens,
            cacheInputTokens: (e.event as any).answer.cacheInputTokens,
            cacheCreateInputTokens: (e.event as any).answer.cacheCreateInputTokens,
          },
        },
      })))};
              // Convert ISO strings back to Date objects
              window.llmEvents = window.llmEvents.map(e => ({
                ...e,
                timestamp: new Date(e.timestamp)
              }));
            </script>`
      : ''
    }
        <script src="/js/reloadPage.js"></script>
        <script src="/js/taskEventChart.js"></script>
        <script src="/js/taskEventLlmChart.js"></script>
        <script src="/js/taskActionChart.js"></script>
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>Junie Explorer: Task ${task.id} Events</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb" data-testid="breadcrumb-navigation">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/" data-testid="breadcrumb-projects">Projects</a></li>
              <li class="breadcrumb-item"><a href="/project/${encodeURIComponent(projectName)}" data-testid="breadcrumb-project-name">${projectName}</a></li>
              <li class="breadcrumb-item"><a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}" data-testid="breadcrumb-issue-name">${issue?.name}</a></li>
              <li class="breadcrumb-item active">Task ${task.id} Events</li>
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
            ${task.context.description ? `
              <div class="task-description">
                <h3>Task Description</h3>
                ${marked(escapeHtml(task.context.description))}
              </div>
            ` : ''}
          </div>

          ${hasLlmEvents ? `
            <div class="collapsible-section" data-testid="event-metrics-section">
              <div class="collapsible-header" data-testid="event-metrics-header">
                <h3>Event Metrics</h3>
                <span class="collapsible-toggle">Click to collapse</span>
              </div>
              <div class="collapsible-content">
                <div class="provider-filters">
                  <div class="filter-controls">
                    <label><input type="checkbox" id="all-providers" checked> All</label>
                    <label><input type="checkbox" id="none-providers"> None</label>
                    ${llmGraphData.providers.map(provider => `
                      <label><input type="checkbox" class="provider-checkbox" data-provider="${provider}" checked> ${provider}</label>
                    `).join('')}
                  </div>
                </div>
                <div class="graph-container">
                  <canvas id="llmMetricsChart"></canvas>
                </div>
              </div>
            </div>
          ` : ''}

          ${events.length > 0 ? `
            <div class="collapsible-section collapsed" data-testid="event-timeline-section">
              <div class="collapsible-header" data-testid="event-timeline-header">
                <h3>Event Timeline</h3>
                <span class="collapsible-toggle">Click to expand</span>
              </div>
              <div class="collapsible-content">
                <div class="event-timeline-container">
                  <canvas id="event-timeline-chart" class="event-timeline-chart"></canvas>
                </div>
              </div>
            </div>
            <script>
              window.taskEvents = ${JSON.stringify(events.map(e => ({
      timestamp: e.timestamp.toISOString(),
      event: { type: e.event.type },
    })))};
              // Convert ISO strings back to Date objects
              window.taskEvents = window.taskEvents.map(e => ({
                ...e,
                timestamp: new Date(e.timestamp)
              }));
            </script>
          ` : ''}

          ${hasActionEvents ? `
            <div class="collapsible-section collapsed" data-testid="action-timeline-section">
              <div class="collapsible-header" data-testid="action-timeline-header">
                <h3>Action Timeline</h3>
                <span class="collapsible-toggle">Click to expand</span>
              </div>
              <div class="collapsible-content">
                <div class="action-timeline-container">
                  <canvas id="action-timeline-chart" class="action-timeline-chart"></canvas>
                </div>
              </div>
            </div>
            <script>
              window.taskActionEvents = ${JSON.stringify(actionEvents.map(e => ({
      timestamp: e.timestamp.toISOString(),
      eventType: e.eventType,
      actionName: e.actionName,
      inputParamValue: e.inputParamValue,
    })))};
              // Convert ISO strings back to Date objects
              window.taskActionEvents = window.taskActionEvents.map(e => ({
                ...e,
                timestamp: new Date(e.timestamp)
              }));
            </script>
          ` : ''}

          ${events.length > 0 ? `
            <div class="collapsible-section collapsed" data-testid="event-statistics-section">
              <div class="collapsible-header" data-testid="event-statistics-header">
                <h3>Event Type Statistics</h3>
                <span class="collapsible-toggle">Click to expand</span>
              </div>
              <div class="collapsible-content">
                <div class="event-type-statistics">
                  <table class="event-stats-table" data-testid="event-stats-table">
                    <thead>
                      <tr>
                        <th class="event-type-col">Event Type</th>
                        <th class="count-duration-col">Sample Count</th>
                        <th class="min-duration-col">Min Duration (ms)</th>
                        <th class="max-duration-col">Max Duration (ms)</th>
                        <th class="avg-duration-col">Avg Duration (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(() => {
      // Calculate durations for each event
      const eventDurations = events.map((eventRecord, index) => {
        let duration = 0
        if (index > 0) {
          const prevRecord = events[index - 1]
          duration = eventRecord.timestamp.getTime() - prevRecord.timestamp.getTime()
        }
        return {
          type: eventRecord.event.type,
          duration: duration,
        }
      })

      // Group by event type and calculate statistics
      const eventTypeStats = new Map<string, number[]>(task.eventTypes.map(eventType => [eventType, []]))
      eventDurations.forEach(({ type, duration }) => {
        if (!eventTypeStats.has(type)) {
          eventTypeStats.set(type, [])
        }
        eventTypeStats.get(type)!.push(duration)
      })

      // Calculate min, max, avg for each event type
      const statsRows: string[] = []
      for (const [eventType, durations] of eventTypeStats.entries()) {
        const min = Math.min(...durations)
        const max = Math.max(...durations)
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length

        statsRows.push(`
                            <tr data-testid="event-stats-row-${escapeHtml(eventType)}">
                              <td class="event-type-col">${escapeHtml(eventType)}</td>
                              <td class="count-duration-col">${durations.length}</td>
                              <td class="min-duration-col">${min}</td>
                              <td class="max-duration-col">${max}</td>
                              <td class="avg-duration-col">${Math.round(avg)}</td>
                            </tr>
                          `)
      }

      return statsRows.join('')
    })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ` : ''}

          ${events.length > 0 ? `
            <div class="event-filters">
              <div class="event-filter-toolbar">
                <div class="filter-label">Filter by Event Type:</div>
                <div class="event-filter all-none-toggle" data-testid="all-none-toggle">
                  <label>All/None</label>
                </div>
                ${task.eventTypes.map(eventType => `
                  <div class="event-filter" data-event-type="${escapeHtml(eventType)}" data-testid="event-filter-${escapeHtml(eventType)}">
                    <label>${escapeHtml(eventType)}</label>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${events.length > 0
      ? `
              <table class="events-table" data-testid="events-table">
                <thead>
                  <tr>
                    <th class="timestamp-col">Timestamp</th>
                    <th class="event-type-col">Event Type</th>
                    <th class="json-col">JSON</th>
                    <th class="cost-col">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${events.map((eventRecord, index) => {
        // Calculate timestamp display
        let timestampDisplay = '-'
        if (index === 0) {
          // First record: show time only
          timestampDisplay = new Date(eventRecord.timestamp).toLocaleTimeString()
        } else {
          // Subsequent records: show elapsed milliseconds since previous record
          const prevRecord = events[index - 1]
          const elapsed = eventRecord.timestamp.getTime() - prevRecord.timestamp.getTime()
          timestampDisplay = `+${elapsed}ms`
        }

        if (eventRecord.event.type === 'LlmResponseEvent') {
          cost += eventRecord.event.answer.cost
        }

        return `
                      <tr data-testid="event-row-${index}">
                        <td class="timestamp-col">${timestampDisplay}</td>
                        <td class="event-type-col ${eventRecord.parseError ? 'error' : ''}">
                          ${escapeHtml(eventRecord.event.type)}
                          ${eventRecord.parseError ? '(parseError)' : ''}
                        </td>
                        <td class="json-col">
                          <div class="json-content">${escapeHtml(JSON.stringify(eventRecord.event, null, 2))}</div>
                        </td>
                        <td class="cost-col">
                          ${eventRecord.event.type === 'LlmResponseEvent' ? eventRecord.event.answer.cost.toFixed(4) : '-'}  
                        </td>
                      </tr>
                    `
      }).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="text-align: right">Total Cost</td>
                    <td class="cost-col">${cost.toFixed(4)}</td>
                  </tr>
                </tfoot>
              </table>
            `
      : '<div class="no-events" data-testid="no-events-message">No events found for this task</div>'
    }
        </div>

        <script src="/js/taskEventFilters.js"></script>
        <script src="/js/collapsibleSections.js"></script>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating task events page:', error)
    res.status(500).send('An error occurred while generating the task events page')
  }
})

// Task trajectories page route
router.get('/project/:projectName/issue/:issueId/task/:taskId/trajectories', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)
    const task = issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    // Get trajectories for the task
    const trajectories = task.trajectories

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task ${task.id} Trajectories</title>
        <link rel="stylesheet" href="/css/style.css">
        <link rel="icon" href="/icons/favicon.png" sizes="any" type="image/png">
        <script src="/js/reloadPage.js"></script>
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>Junie Explorer: Task ${task.id} Trajectories</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb" data-testid="breadcrumb-navigation">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/" data-testid="breadcrumb-projects">Projects</a></li>
              <li class="breadcrumb-item"><a href="/project/${encodeURIComponent(projectName)}" data-testid="breadcrumb-project-name">${projectName}</a></li>
              <li class="breadcrumb-item"><a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}" data-testid="breadcrumb-issue-name">${issue?.name}</a></li>
              <li class="breadcrumb-item active">Task ${task.id} Trajectories</li>
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
            ${task.context.description ? `
              <div class="task-description">
                <h3>Task Description</h3>
                ${marked(escapeHtml(task.context.description))}
              </div>
            ` : ''}
          </div>

          ${trajectories.length > 0
      ? `
              <table class="trajectories-table" data-testid="trajectories-table">
                <thead>
                  <tr>
                    <th class="timestamp-col">Timestamp</th>
                    <th class="role-col">Role</th>
                    <th class="content-col">Content</th>
                  </tr>
                </thead>
                <tbody>
                  ${trajectories.map((trajectory, index) => {
        // Handle trajectory errors
        if ('error' in trajectory) {
          return `
                        <tr data-testid="trajectory-error-row-${index}">
                          <td class="timestamp-col">-</td>
                          <td class="role-col">ERROR</td>
                          <td class="content-col"><div class="content-wrapper">Error parsing trajectory: ${escapeHtml(String(trajectory.error))}</div></td>
                        </tr>
                      `
        }

        // Type guard to ensure we have a valid trajectory
        if ('timestamp' in trajectory && 'role' in trajectory && 'content' in trajectory) {
          return `
                        <tr data-testid="trajectory-row-${index}" class="role-${trajectory.role}">
                          <td class="timestamp-col">${trajectory.timestamp.toLocaleString()}</td>
                          <td class="role-col">${escapeHtml(trajectory.role)}</td>
                          <td class="content-col"><div class="content-wrapper">${escapeHtml(trajectory.content.trim())}</div></td>
                        </tr>
                      `
        }

        // Fallback for unknown trajectory format
        return `
                      <tr data-testid="trajectory-unknown-row-${index}">
                        <td class="timestamp-col">-</td>
                        <td class="role-col">UNKNOWN</td>
                        <td class="content-col"><div class="content-wrapper">Unknown trajectory format</div></td>
                      </tr>
                    `
      }).join('')}
                </tbody>
              </table>
            `
      : '<div class="no-trajectories" data-testid="no-trajectories-message">No trajectories found for this task</div>'
    }
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating task trajectories page:', error)
    res.status(500).send('An error occurred while generating the task trajectories page')
  }
})


export default router
