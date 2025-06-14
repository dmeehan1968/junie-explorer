import express from 'express'
import { marked } from 'marked'
import { jetBrains } from '../jetbrains.js'
import { escapeHtml } from "../utils/escapeHtml.js"
import { calculateStepSummary } from '../utils/metricsUtils.js'
import { formatSeconds } from '../utils/timeUtils.js'
import { Metrics } from "../Step.js"

const router = express.Router()

// Function to generate HTML for step totals table
const generateStepTotalsTable = (summaryData: Metrics): string => {
  // Calculate total time as sum of build time, model time, artifact time and model cached time
  const totalTime = summaryData.buildTime + summaryData.modelTime / 1000 + summaryData.artifactTime + summaryData.modelCachedTime / 1000

  return `
  <table class="step-totals-table">
    <tbody>
      <tr>
        <td>Input Tokens: ${summaryData.inputTokens}</td>
        <td>Output Tokens: ${summaryData.outputTokens}</td>
        <td>Cache Tokens: ${summaryData.cacheTokens}</td>
        <td>Cost: ${summaryData.cost.toFixed(4)}</td>
        <td>Total Time: ${formatSeconds(totalTime)}</td>
      </tr>
    </tbody>
  </table>
`
}

// Issue tasks page route
router.get('/project/:projectName/issue/:issueId', (req, res) => {
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
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/">Projects</a></li>
              <li class="breadcrumb-item"><a href="/project/${encodeURIComponent(projectName)}">${projectName}</a></li>
              <li class="breadcrumb-item active">${escapeHtml(issue.name)}</li>
            </ol>
          </nav>

          <div class="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="ide-icon" />
            `).join('')}
          </div>

          <div class="issue-details">
            <div class="issue-created">Created: ${new Date(issue.created).toLocaleString()}</div>
            <div class="issue-state state-${issue.state.toLowerCase()}">${issue.state}</div>
          </div>

          <ul class="task-list">
            ${issue.tasks.size > 0
      ? [...issue.tasks.values()].map((task, index) => {
        // Calculate step totals for this task
        const stepTotals = calculateStepSummary([...task.steps.values()])

        return `
                    <li class="task-item">
                      <div class="task-header">
                        <div class="task-id">${index === 0 ? 'Initial Request' : `Follow up ${index}`}</div>
                        <div class="task-date">
                          Created: ${new Date(task.created).toLocaleString()}
                          <button class="toggle-raw-data" data-task="${index}">JSON</button>
                        </div>
                      </div>
                      <div id="raw-data-${index}" class="raw-data-container" style="display: none;">
                        <div id="json-renderer-${index}" class="json-renderer"></div>
                      </div>
                      <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${index}" class="task-link">
                        ${task.context.description ? `<div class="task-description">${marked(escapeHtml(task.context.description))}</div>` : ''}
                        <div class="task-details">
                          ${generateStepTotalsTable(stepTotals)}
                        </div>
                      </a>
                    </li>
                  `
      }).join('')
      : '<li>No tasks found for this issue</li>'
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
