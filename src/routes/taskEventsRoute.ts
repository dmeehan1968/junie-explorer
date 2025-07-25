import express from 'express'
import fs from 'fs-extra'
import path from 'node:path'
import { marked } from 'marked'
import { EventRecord } from '../eventSchema.js'
import { JetBrains } from "../jetbrains.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"

const router = express.Router()

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

// Task events download route
router.get('/project/:projectName/issue/:issueId/task/:taskId/events/download', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)
    const task = issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    if (!fs.existsSync(task.eventsFile)) {
      return res.status(404).send('Events file not found')
    }

    const filename = path.basename(task.eventsFile)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/jsonl')
    
    res.sendFile(path.resolve(task.eventsFile))
  } catch (error) {
    console.error('Error downloading events file:', error)
    res.status(500).send('An error occurred while downloading the events file')
  }
})

// Task events page route
router.get('/project/:projectName/issue/:issueId/task/:taskId/events', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
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
              <div class="task-created">Created: ${new Date(task.created).toLocaleString(getLocaleFromRequest(req))}</div>
              <div class="task-download">
                <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/events/download" class="reload-button">Download Events as JSONL</a>
              </div>
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

export default router