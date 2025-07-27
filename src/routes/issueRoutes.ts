import express from 'express'
import { marked } from "marked"
import { JetBrains } from "../jetbrains.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { formatSeconds } from '../utils/timeUtils.js'
import { SummaryMetrics } from "../schema.js"
import { VersionBanner } from '../utils/versionBanner.js'
import { ReloadButton } from '../utils/reloadButton.js'

const router = express.Router()

// Function to generate HTML for step totals table
const generateStepTotalsTable = (summaryData: SummaryMetrics): string => {
  return `
  <div class="overflow-x-auto mb-4" data-testid="task-metrics">
    <table class="table table-compact w-full bg-base-100">
      <tbody>
        <tr>
          <td class="text-sm"><span class="font-semibold">Input Tokens:</span> ${summaryData.inputTokens}</td>
          <td class="text-sm"><span class="font-semibold">Output Tokens:</span> ${summaryData.outputTokens}</td>
          <td class="text-sm"><span class="font-semibold">Cache Tokens:</span> ${summaryData.cacheTokens}</td>
          <td class="text-sm"><span class="font-semibold">Cost:</span> ${summaryData.cost.toFixed(4)}</td>
          <td class="text-sm"><span class="font-semibold">Total Time:</span> ${formatSeconds(summaryData.time / 1000)}</td>
        </tr>
      </tbody>
    </table>
  </div>
`
}

// Issue tasks page route
router.get('/project/:projectName/issue/:issueId', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const tasks = await issue?.tasks

    if (!project || !issue) {
      return res.status(404).send('Issue not found')
    }

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en" data-theme="light">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(issue.name)} Tasks</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.css">
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/taskRawData.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-7xl mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer: ${escapeHtml(issue.name)}</h1>
            ${ReloadButton()}
          </div>
          ${VersionBanner(jetBrains.version)}
          <nav aria-label="breadcrumb" data-testid="breadcrumb-navigation" class="mb-5">
            <div class="breadcrumbs">
              <ul>
                <li><a href="/" class="text-primary hover:text-primary-focus" data-testid="breadcrumb-projects">Projects</a></li>
                <li><a href="/project/${encodeURIComponent(projectName)}" class="text-primary hover:text-primary-focus" data-testid="breadcrumb-project-name">${projectName}</a></li>
                <li class="text-base-content/70">${escapeHtml(issue.name)}</li>
              </ul>
            </div>
          </nav>

          <div class="flex gap-2 mb-5" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
            `).join('')}
          </div>

          <div class="flex justify-between items-center mb-5 p-4 bg-base-200 rounded-lg">
            <div class="text-sm text-base-content/70" data-testid="issue-date">Created: ${new Date(issue.created).toLocaleString(getLocaleFromRequest(req))}</div>
            <div class="badge badge-primary" data-testid="issue-state">${issue.state}</div>
          </div>

          <div class="space-y-4" data-testid="tasks-list">
            ${tasks?.size ?? 0 > 0
      ? (await Promise.all([...tasks?.values() ?? []].map(async (task, index) => {
        // Use aggregated metrics from task
        const stepTotals = await task.metrics

        return `
                    <div class="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-all duration-300" data-testid="task-item">
                      <div class="card-body">
                        <div class="flex justify-between items-center mb-4">
                          <h3 class="text-xl font-bold text-primary">${index === 0 ? 'Initial Request' : `Follow up ${index}`}</h3>
                          <div class="text-sm text-base-content/70">
                            Created: ${new Date(task.created).toLocaleString(getLocaleFromRequest(req))}
                          </div>
                        </div>
                        ${task.context.description ? `<div class="prose prose-sm max-w-none mb-4 p-4 bg-warning/10 rounded-lg" data-testid="task-description">${marked(escapeHtml(task.context.description))}</div>` : ''}
                        <div data-testid="task-details">
                          ${generateStepTotalsTable(stepTotals)}
                        </div>
                        <div class="flex flex-wrap gap-2 mt-4">
                          <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${index}/events" class="btn btn-primary btn-sm flex-1 min-w-0" data-testid="events-button">Events</a>
                          <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${index}/trajectories" class="btn btn-primary btn-sm flex-1 min-w-0" data-testid="trajectories-button">Trajectories</a>
                          <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${index}" class="btn btn-primary btn-sm flex-1 min-w-0" data-testid="steps-button">Steps</a>
                          <button class="btn btn-secondary btn-sm flex-1 min-w-0 toggle-raw-data" data-task="${index}" data-testid="json-button">Raw JSON</button>
                        </div>
                        <div id="raw-data-${index}" class="mt-4 p-4 bg-base-200 rounded-lg border border-base-300" data-testid="json-viewer" style="display: none;">
                          <div id="json-renderer-${index}" class="text-sm"></div>
                        </div>
                      </div>
                    </div>
                  `
      }))).join('')
      : '<div class="p-4 text-center text-base-content/70" data-testid="no-tasks-message">No tasks found for this issue</div>'
    }
          </div>
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating tasks page:', error)
    res.status(500).send('An error occurred while generating the tasks page')
  }
})

// API endpoint to get task data for a specific issue
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

    // Return the task data with only public fields
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
      trajectories: task.trajectories,
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
