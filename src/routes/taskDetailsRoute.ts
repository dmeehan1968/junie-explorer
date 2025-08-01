import express from 'express'
import { Breadcrumb } from '../components/breadcrumb.js'
import { ReloadButton } from '../components/reloadButton.js'
import { TaskDetailFlexGrid } from '../components/taskDetailFlexGrid.js'
import { ThemeSwitcher } from '../components/themeSwitcher.js'
import { VersionBanner } from '../components/versionBanner.js'
import { JetBrains } from "../jetbrains.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { createEventFormatter } from '../utils/eventFormatters.js'
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"

const router = express.Router()

// Task details page route
router.get('/project/:projectName/issue/:issueId/task/:taskId/details', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    // Load events
    const events = await task.events
    const locale = getLocaleFromRequest(req)
    const eventFormatter = createEventFormatter()

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task ${taskId} Details - ${escapeHtml(issue.name)}</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/taskDetailsFilters.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Task ${taskId} Details</h1>
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
        {
          label: issue.name,
          href: `/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}`,
          testId: 'breadcrumb-issue-name',
        },
        { label: `Task ${taskId} Details`, testId: 'breadcrumb-task-details' },
      ],
    })}

          <div class="flex gap-2 mb-5" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
            `).join('')}
          </div>

          <div class="flex justify-between items-center mb-5 p-4 bg-base-200 rounded-lg">
            <div class="text-sm text-base-content/70" data-testid="task-date">Created: ${new Date(task.created).toLocaleString(getLocaleFromRequest(req))}</div>
          </div>

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
              <div class="events-grid">
                ${(() => {
        return events.map((eventRecord, index) => {
          return TaskDetailFlexGrid({
            eventRecord,
            index,
            locale,
            eventFormatter,
          })
        }).join('')
      })()}
              </div>
            `
      : '<div class="p-4 text-center text-base-content/70" data-testid="no-events-message">No events found for this task</div>'
    }
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating task details page:', error)
    res.status(500).send('An error occurred while generating the task details page')
  }
})

export default router