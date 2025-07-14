import express from 'express'
import { marked } from "marked"
import { JetBrains } from "../jetbrains.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { formatSeconds } from '../utils/timeUtils.js'
import { SummaryMetrics } from "../schema.js"

const router = express.Router()

// Function to generate HTML for step totals table
const generateStepTotalsTable = (summaryData: SummaryMetrics): string => {
  return `
  <table class="step-totals-table" data-testid="task-metrics">
    <tbody>
      <tr>
        <td>Input Tokens: ${summaryData.inputTokens}</td>
        <td>Output Tokens: ${summaryData.outputTokens}</td>
        <td>Cache Tokens: ${summaryData.cacheTokens}</td>
        <td>Cost: ${summaryData.cost.toFixed(4)}</td>
        <td>Total Time: ${formatSeconds(summaryData.time / 1000)}</td>
      </tr>
    </tbody>
  </table>
`
}

// Issue tasks page route
router.get('/project/:projectName/issue/:issueId', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId } = req.params
    const project = jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)

    if (!project || !issue) {
      return res.status(404).send('Issue not found')
    }

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(issue.name)} Tasks</title>
        <link rel="stylesheet" href="/css/style.css">
        <link rel="icon" href="/icons/favicon.png" sizes="any" type="image/png">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.css">
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/taskRawData.js"></script>
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>Junie Explorer: ${escapeHtml(issue.name)}</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb" data-testid="breadcrumb-navigation">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/" data-testid="breadcrumb-projects">Projects</a></li>
              <li class="breadcrumb-item"><a href="/project/${encodeURIComponent(projectName)}" data-testid="breadcrumb-project-name">${projectName}</a></li>
              <li class="breadcrumb-item active">${escapeHtml(issue.name)}</li>
            </ol>
          </nav>

          <div class="ide-icons" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="ide-icon" />
            `).join('')}
          </div>

          <div class="issue-details">
            <div class="issue-created" data-testid="issue-date">Created: ${new Date(issue.created).toLocaleString()}</div>
            <div class="issue-state state-${issue.state.toLowerCase()}" data-testid="issue-state">${issue.state}</div>
          </div>

          <ul class="task-list" data-testid="tasks-list">
            ${issue.tasks.size > 0
      ? [...issue.tasks.values()].map((task, index) => {
        // Use aggregated metrics from task
        const stepTotals = task.metrics

        return `
                    <li class="task-item" data-testid="task-item">
                      <div class="task-header">
                        <div class="task-id">${index === 0 ? 'Initial Request' : `Follow up ${index}`}</div>
                        <div class="task-date">
                          Created: ${new Date(task.created).toLocaleString()}
                        </div>
                      </div>
                      ${task.context.description ? `<div class="task-description" data-testid="task-description">${marked(escapeHtml(task.context.description))}</div>` : ''}
                      <div class="task-details" data-testid="task-details">
                        ${generateStepTotalsTable(stepTotals)}
                      </div>
                      <div class="task-buttons">
                        <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${index}/events" class="task-action-button" data-testid="events-button">Events</a>
                        <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${index}/trajectories" class="task-action-button" data-testid="trajectories-button">Trajectories</a>
                        <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${index}" class="task-action-button" data-testid="steps-button">Steps</a>
                        <button class="task-action-button toggle-raw-data" data-task="${index}" data-testid="json-button">Raw JSON</button>
                      </div>
                      <div id="raw-data-${index}" class="raw-data-container" data-testid="json-viewer" style="display: none;">
                        <div id="json-renderer-${index}" class="json-renderer"></div>
                      </div>
                    </li>
                  `
      }).join('')
      : '<li data-testid="no-tasks-message">No tasks found for this issue</li>'
    }
          </ul>
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
router.get('/api/project/:projectName/issue/:issueId/task/:taskId', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)
    const task = issue?.getTaskById(taskId)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Return the task data with only public fields
    res.json(task)
  } catch (error) {
    console.error('Error fetching task data:', error)
    res.status(500).json({ error: 'An error occurred while fetching task data' })
  }
})

export default router
