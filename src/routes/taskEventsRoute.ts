import express from 'express'
import fs from 'fs-extra'
import path from 'node:path'
import { JetBrains } from "../jetbrains.js"
import { EventRecord } from "../schema/eventRecord.js"
import { LlmResponseEvent } from "../schema/llmResponseEvent.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { VersionBanner } from '../components/versionBanner.js'
import { ReloadButton } from '../components/reloadButton.js'
import { Breadcrumb } from '../components/breadcrumb.js'
import { ThemeSwitcher } from '../components/themeSwitcher.js'
import { TaskCard } from '../components/taskCard.js'
import { themeAttributeForHtml } from '../utils/themeCookie.js'

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
  const llmEvents = events.filter((event): event is { event: LlmResponseEvent, timestamp: Date } => event.event.type === 'LlmResponseEvent')

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
  const providers = [...new Set(llmEvents.map(event => event.event.answer.llm.groupName))].sort()

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

// Task event timeline API endpoint
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/events/timeline', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Get events for the task
    const events = await task.events

    // Map events for Event Timeline
    const timelineEvents = events.map(e => ({
      timestamp: e.timestamp.toISOString(),
      event: { type: e.event.type },
    }))

    res.json(timelineEvents)
  } catch (error) {
    console.error('Error fetching timeline events:', error)
    res.status(500).json({ error: 'An error occurred while fetching timeline events' })
  }
})


// Task events download route
router.get('/project/:projectName/issue/:issueId/task/:taskId/events/download', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

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
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    const hasMetrics = (await task.metrics).metricCount > 0

    // Get events for the task
    const events = await task.events
    let cost = 0

    // Prepare LLM event graph data
    const llmGraphData = prepareLlmEventGraphData(events)


    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en" ${themeAttributeForHtml(req.headers.cookie)}>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task ${task.id} Events</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        ${hasMetrics
      ? `<script>
              // Define the LLM chart data as a global variable
              window.llmChartData = ${JSON.stringify(llmGraphData)};
              // Define the LLM events data for filtering
              window.llmEvents = ${JSON.stringify(events.filter((e): e is { event: LlmResponseEvent, timestamp: Date } => e.event.type === 'LlmResponseEvent').map(e => ({
                  timestamp: e.timestamp.toISOString(),
                  event: {
                    type: e.event.type,
                    answer: {
                      llm: { provider: e.event.answer.llm.groupName },
                      cost: e.event.answer.cost,
                      inputTokens: e.event.answer.inputTokens,
                      outputTokens: e.event.answer.outputTokens,
                      cacheInputTokens: e.event.answer.cacheInputTokens,
                      cacheCreateInputTokens: e.event.answer.cacheCreateInputTokens,
                    },
                  },
                }))
              )};
              // Convert ISO strings back to Date objects
              window.llmEvents = window.llmEvents.map(e => ({
                ...e,
                timestamp: new Date(e.timestamp)
              }));
            </script>`
      : ''
    }
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.css">
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.js"></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/taskEventChart.js"></script>
        <script src="/js/taskEventLlmChart.js"></script>
        <script src="/js/taskRawData.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer: Task ${task.id} Events</h1>
            <div class="flex items-center gap-3">
              ${ThemeSwitcher()}
              ${ReloadButton()}
            </div>
          </div>
          ${VersionBanner(jetBrains.version)}
          ${Breadcrumb({
            items: [
              { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
              { label: projectName, href: `/project/${encodeURIComponent(projectName)}`, testId: 'breadcrumb-project-name' },
              { label: issue?.name || '', testId: 'breadcrumb-issue-name' },
              { label: `Task ${task.id} Events`, testId: 'breadcrumb-task-events' }
            ]
          })}

          <div class="flex gap-2 mb-5" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
            `).join('')}
          </div>

          <div class="mb-5">
            ${await TaskCard({
              projectName,
              issueId,
              taskIndex: taskId,
              task,
              locale: getLocaleFromRequest(req),
              issueTitle: issue.name,
              actionsHtml: `<a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/events/download" class=\"btn btn-primary btn-sm\">Download Events as JSONL</a>`,
              tasksCount: (await issue.tasks).size,
              tasksDescriptions: [...(await issue.tasks).values()].map(t => t?.context?.description ?? ''),
              currentTab: 'events',
            })}
          </div>

          ${hasMetrics ? `
            <div class="collapsible-section mb-5 bg-base-100 rounded-lg border border-base-300" data-testid="event-metrics-section">
              <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-100 rounded-t-lg hover:bg-base-200 transition-colors duration-200" data-testid="event-metrics-header">
                <h3 class="text-xl font-bold text-primary m-0">Event Metrics</h3>
                <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to collapse</span>
              </div>
              <div class="collapsible-content px-4 pb-4 block transition-all duration-300">
                <div class="mb-4">
                  <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-3 flex-wrap justify-between">
                      <div id="llm-provider-filters" class="join flex flex-wrap" data-testid="llm-provider-filters">
                        <!-- Provider buttons will be populated by JavaScript -->
                      </div>
                    </div>
                  </div>
                </div>
                <div class="w-full h-96">
                  <canvas id="llmMetricsChart"></canvas>
                </div>
              </div>
            </div>
          ` : ''}

          ${events.length > 0 ? `
            <div class="collapsible-section collapsed mb-5 bg-base-100 rounded-lg border border-base-300 collapsed" data-testid="event-timeline-section">
              <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-100 rounded-lg hover:bg-base-200 transition-colors duration-200" data-testid="event-timeline-header">
                <h3 class="text-xl font-bold text-primary m-0">Event Timeline</h3>
                <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
              </div>
              <div class="collapsible-content px-4 pb-4 hidden transition-all duration-300">
                <div class="w-full">
                  <canvas id="event-timeline-chart" class="w-full max-w-full border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
                </div>
              </div>
            </div>
          ` : ''}


          ${events.length > 0 ? `
            <div class="collapsible-section collapsed mb-5 bg-base-100 rounded-lg border border-base-300 collapsed" data-testid="event-statistics-section">
              <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-100 rounded-lg hover:bg-base-200 transition-colors duration-200" data-testid="event-statistics-header">
                <h3 class="text-xl font-bold text-primary m-0">Event Type Statistics</h3>
                <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
              </div>
              <div class="collapsible-content px-4 pb-4 hidden transition-all duration-300">
                <div class="overflow-x-auto">
                  <table class="table table-zebra table-sm w-full bg-base-100 text-base-content text-sm" data-testid="event-stats-table">
                    <thead>
                      <tr class="!bg-base-200">
                        <th class="text-left w-2/5 whitespace-nowrap">Event Type</th>
                        <th class="text-right whitespace-nowrap">Sample Count</th>
                        <th class="text-right whitespace-nowrap">Min Duration (ms)</th>
                        <th class="text-right whitespace-nowrap">Max Duration (ms)</th>
                        <th class="text-right whitespace-nowrap">Avg Duration (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${await (async () => {
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
      const eventTypeStats = new Map<string, number[]>((await task.eventTypes).map(eventType => [eventType, []]))
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
                              <td class="text-left whitespace-normal break-words w-2/5">${escapeHtml(eventType)}</td>
                              <td class="text-right whitespace-nowrap">${durations.length}</td>
                              <td class="text-right whitespace-nowrap">${min}</td>
                              <td class="text-right whitespace-nowrap">${max}</td>
                              <td class="text-right whitespace-nowrap">${Math.round(avg)}</td>
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
            <div class="mb-5">
              <div class="flex flex-wrap gap-2 mb-5 p-4 bg-base-200 rounded items-center">
                <div class="font-bold mr-2 flex items-center">Filter by Event Type:</div>
                <div class="cursor-pointer transition-all duration-300 rounded flex items-center gap-1 event-filter all-none-toggle" data-testid="all-none-toggle">
                  <label class="cursor-pointer text-sm font-bold py-1 px-2 rounded transition-all duration-300 bg-primary border border-primary-300 text-primary-content">All/None</label>
                </div>
                ${(await task.eventTypes).map(eventType => `
                  <div class="cursor-pointer transition-all duration-300 rounded flex items-center gap-1 event-filter" data-event-type="${escapeHtml(eventType)}" data-testid="event-filter-${escapeHtml(eventType)}">
                    <label class="cursor-pointer text-sm py-1 px-2 rounded transition-all duration-300 bg-secondary border border-secondary-300 text-secondary-content">${escapeHtml(eventType)}</label>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${events.length > 0
      ? `
              <div class="overflow-x-auto">
                <table class="table w-full bg-base-100" data-testid="events-table">
                  <thead>
                    <tr class="!bg-base-200 text-base-content">
                      <th class="text-left whitespace-nowrap w-fit">Timestamp</th>
                      <th class="text-left whitespace-nowrap w-fit">Event Type</th>
                      <th class="text-left whitespace-nowrap max-w-2xl">JSON</th>
                      <th class="text-right whitespace-nowrap w-fit">Cost</th>
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
                      <tr data-testid="event-row-${index}" class="text-base-content">
                        <td class="text-left whitespace-nowrap w-fit">${timestampDisplay}</td>
                        <td class="text-left whitespace-nowrap w-fit ${eventRecord.parseError ? 'bg-red-100 text-red-800' : ''}">
                          ${escapeHtml(eventRecord.event.type)}
                          ${eventRecord.parseError ? '(parseError)' : ''}
                        </td>
                        <td class="text-left max-w-2xl">
                          <div class="max-h-48 overflow-auto bg-base-200 text-base-content p-2 rounded font-mono text-xs whitespace-pre break-all">${escapeHtml(JSON.stringify(eventRecord.event, null, 2))}</div>
                        </td>
                        <td class="text-right whitespace-nowrap w-fit">
                          ${eventRecord.event.type === 'LlmResponseEvent' ? eventRecord.event.answer.cost.toFixed(4) : '-'}  
                        </td>
                      </tr>
                    `
      }).join('')}
                </tbody>
                <tfoot>
                  <tr class="!bg-gray-50 font-bold border-t-2 border-gray-300">
                    <td colspan="3" class="text-right">Total Cost</td>
                    <td class="text-right whitespace-nowrap">${cost.toFixed(4)}</td>
                  </tr>
                </tfoot>
                </table>
              </div>
            `
      : '<div class="p-4 text-center text-base-content/70" data-testid="no-events-message">No events found for this task</div>'
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

// API endpoint to get task data for a specific issue (migrated from issueRoutes)
router.get('/api/project/:projectName/issue/:issueId/task/:taskId', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json({
      logPath: task.logPath,
      id: task.id,
      created: task.created,
      context: task.context,
      isDeclined: task.isDeclined,
      plan: task.plan,
      eventsFile: task.eventsFile,
      events: await task.events,
      trajectoriesFile: task.trajectoriesFile,
      steps: task.steps,
      metrics: await task.metrics,
      previousTasksInfo: task.previousTasksInfo,
      finalAgentState: task.finalAgentState,
      sessionHistory: task.sessionHistory,
      patch: task.patch,
    })
  } catch (error) {
    console.error('Error fetching task data:', error)
    res.status(500).json({ error: 'An error occurred while fetching task data' })
  }
})

export default router