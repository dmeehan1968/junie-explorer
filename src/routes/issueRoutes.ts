import express from 'express'
import { JetBrains } from "../jetbrains.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { getStatusBadge } from "../components/statusBadge.js"
import { VersionBanner } from '../components/versionBanner.js'
import { ReloadButton } from '../components/reloadButton.js'
import { Breadcrumb } from '../components/breadcrumb.js'
import { ThemeSwitcher } from '../components/themeSwitcher.js'
import { TaskCard } from '../components/taskCard.js'

const router = express.Router()

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
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(issue.name)} Tasks</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.css">
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.js"></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/taskRawData.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer: ${escapeHtml(issue.name)}</h1>
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
              { label: issue.name, testId: 'breadcrumb-issue-name' }
            ]
          })}

          <div class="flex gap-2 mb-5" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
            `).join('')}
          </div>

          <div class="flex justify-between items-center mb-5 p-4 bg-base-200 rounded-lg">
            <div class="text-sm text-base-content/70" data-testid="issue-date">Created: ${new Date(issue.created).toLocaleString(getLocaleFromRequest(req))}</div>
            <div data-testid="issue-state">${getStatusBadge(issue.state)}</div>
          </div>

          <div class="space-y-4" data-testid="tasks-list">
            ${tasks?.size ?? 0 > 0
      ? (await Promise.all([...tasks?.values() ?? []].map(async (task, index) => {
        return await TaskCard({
          projectName,
          issueId,
          taskIndex: index,
          task,
          locale: getLocaleFromRequest(req),
        })
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
