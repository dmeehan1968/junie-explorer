import express from 'express'
import fs from 'fs-extra'
import { marked } from 'marked'
import path from 'node:path'
import { JetBrains } from "../jetbrains.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { VersionBanner } from '../utils/versionBanner.js'
import { ReloadButton } from '../utils/reloadButton.js'
import { TrajectoryRow } from '../utils/trajectoryRow.js'
import { Breadcrumb } from '../utils/breadcrumb.js'
import { ThemeSwitcher } from '../utils/themeSwitcher.js'

// SVG icons for expand and collapse states
const expandIcon = `<svg 
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="#000000"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8" />
  <path d="M3 16.2V21m0 0h4.8M3 21l6-6" />
  <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" />
  <path d="M3 7.8V3m0 0h4.8M3 3l6 6" />
</svg>`

const collapseIcon = `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 20L15 15M15 15V19M15 15H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 20L9 15M9 15V19M9 15H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 4L15 9M15 9V5M15 9H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 4L9 9M9 9V5M9 9H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const router = express.Router()

// Task trajectories download route
router.get('/project/:projectName/issue/:issueId/task/:taskId/trajectories/download', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    if (!fs.existsSync(task.trajectoriesFile)) {
      return res.status(404).send('Trajectories file not found')
    }

    const filename = path.basename(task.trajectoriesFile)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/jsonl')

    res.sendFile(path.resolve(task.trajectoriesFile))
  } catch (error) {
    console.error('Error downloading trajectories file:', error)
    res.status(500).send('An error occurred while downloading the trajectories file')
  }
})

// Task trajectories page route
router.get('/project/:projectName/issue/:issueId/task/:taskId/trajectories', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

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
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" sizes="any" type="image/png">
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/trajectoryToggle.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer: Task ${task.id} Trajectories</h1>
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
              { label: issue?.name || '', href: `/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}`, testId: 'breadcrumb-issue-name' },
              { label: `Task ${task.id} Trajectories`, testId: 'breadcrumb-task-trajectories' }
            ]
          })}

          <div class="flex gap-1 mb-5">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-6 h-6" />
            `).join('')}
          </div>

          <div class="mb-5">
            <div class="flex justify-between items-center mb-3 p-4 bg-base-200 rounded-lg">
              <div class="text-sm text-base-content/70">Created: ${new Date(task.created).toLocaleString(getLocaleFromRequest(req))}</div>
              <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/trajectories/download" class="btn btn-primary btn-sm">Download Trajectories as JSONL</a>
            </div>
            ${task.context.description ? `
              <div class="bg-base-200 text-base-content p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-primary">Task Description</h3>
                <div class="prose prose-sm max-w-none">${marked(escapeHtml(task.context.description))}</div>
              </div>
            ` : ''}
          </div>

          ${trajectories.length > 0
      ? `
              <div class="overflow-x-auto">
                <table class="table table-fixed w-full" data-testid="trajectories-table">
                  <thead>
                    <tr>
                      <th class="bg-base-200 w-48">Timestamp</th>
                      <th class="bg-base-200 w-24">Role</th>
                      <th class="bg-base-200">Content</th>
                    </tr>
                  </thead>
                <tbody>
                  ${trajectories.map((trajectory, index) => {
        const locale = getLocaleFromRequest(req)
        
        // Handle trajectory errors
        if ('error' in trajectory) {
          return TrajectoryRow({
            role: 'ERROR',
            content: `Error parsing trajectory: ${String(trajectory.error)}`,
            index,
            locale,
            expandIcon,
            collapseIcon,
            testIdPrefix: 'trajectory-error-row'
          })
        }

        // Type guard to ensure we have a valid trajectory
        if ('timestamp' in trajectory && 'role' in trajectory && 'content' in trajectory) {
          return TrajectoryRow({
            timestamp: trajectory.timestamp,
            role: trajectory.role,
            content: trajectory.content,
            index,
            locale,
            expandIcon,
            collapseIcon,
            testIdPrefix: 'trajectory-row'
          })
        }

        // Fallback for unknown trajectory format
        return TrajectoryRow({
          role: 'UNKNOWN',
          content: 'Unknown trajectory format',
          index,
          locale,
          expandIcon,
          collapseIcon,
          testIdPrefix: 'trajectory-unknown-row'
        })
      }).join('')}
                </tbody>
                </table>
              </div>
            `
      : '<div class="text-center text-base-content/70 p-4" data-testid="no-trajectories-message">No trajectories found for this task</div>'
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