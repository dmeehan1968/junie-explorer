import express from 'express'
import fs from 'fs-extra'
import { JetBrains } from "../jetbrains.js"
import { EventRecord } from "../schema/eventRecord.js"
import { Breadcrumb } from '../utils/breadcrumb.js'
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { ReloadButton } from '../utils/reloadButton.js'
import { ThemeSwitcher } from '../utils/themeSwitcher.js'
import { VersionBanner } from '../utils/versionBanner.js'

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

          ${events.length > 0
      ? `
              <div class="overflow-x-auto">
                <table class="table table-fixed w-full bg-base-100" data-testid="details-table">
                  <thead>
                    <tr class="!bg-base-200 text-base-content">
                      <th class="text-left whitespace-nowrap w-42">Timestamp</th>
                      <th class="text-left whitespace-nowrap w-56">Event Type</th>
                      <th class="text-left whitespace-nowrap">JSON</th>
                    </tr>
                  </thead>
                  <tbody>
                  ${events.map((eventRecord, index) => {
        const locale = getLocaleFromRequest(req)
        return `
                      <tr data-testid="detail-row-${index}" class="text-base-content">
                        <td class="text-left whitespace-nowrap">${eventRecord.timestamp.toLocaleString(locale)}</td>
                        <td class="text-left whitespace-nowrap ${eventRecord.parseError ? 'bg-red-100 text-red-800' : ''}">
                          ${escapeHtml(eventRecord.event.type)}
                          ${eventRecord.parseError ? '(parseError)' : ''}
                        </td>
                        <td class="text-left pr-0">
                          <div class="max-h-48 overflow-auto bg-base-200 text-base-content rounded font-mono text-xs whitespace-pre break-all">${escapeHtml(JSON.stringify(eventRecord.event, null, 2))}</div>
                        </td>
                      </tr>
                    `
      }).join('')}
                  </tbody>
                </table>
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