import express from 'express'
import fs from 'fs-extra'
import { marked } from 'marked'
import path from 'node:path'
import { JetBrains } from "../jetbrains.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { VersionBanner } from '../utils/versionBanner.js'

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
        <link rel="stylesheet" href="/css/style.css">
        <link rel="icon" href="/icons/favicon.png" sizes="any" type="image/png">
        <script src="/js/reloadPage.js"></script>
        <script src="/js/trajectoryToggle.js"></script>
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>Junie Explorer: Task ${task.id} Trajectories</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          ${VersionBanner(jetBrains.version)}
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
              <div class="task-created">Created: ${new Date(task.created).toLocaleString(getLocaleFromRequest(req))}</div>
              <div class="task-download">
                <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/trajectories/download" class="reload-button">Download Trajectories as JSONL</a>
              </div>
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
                          <td class="content-col">
                            <div class="content-cell-container">
                              <button class="content-toggle-btn expand-btn" onclick="toggleContentExpansion(this)" title="Expand content">
                                ${expandIcon}
                              </button>
                              <button class="content-toggle-btn collapse-btn" onclick="toggleContentExpansion(this)" title="Collapse content" style="display: none;">
                                ${collapseIcon}
                              </button>
                              <div class="content-wrapper">Error parsing trajectory: ${escapeHtml(String(trajectory.error))}</div>
                            </div>
                          </td>
                        </tr>
                      `
        }

        // Type guard to ensure we have a valid trajectory
        if ('timestamp' in trajectory && 'role' in trajectory && 'content' in trajectory) {
          return `
                        <tr data-testid="trajectory-row-${index}" class="role-${trajectory.role}">
                          <td class="timestamp-col">${trajectory.timestamp.toLocaleString(getLocaleFromRequest(req))}</td>
                          <td class="role-col">${escapeHtml(trajectory.role)}</td>
                          <td class="content-col">
                            <div class="content-cell-container">
                              <button class="content-toggle-btn expand-btn" onclick="toggleContentExpansion(this)" title="Expand content">
                                ${expandIcon}
                              </button>
                              <button class="content-toggle-btn collapse-btn" onclick="toggleContentExpansion(this)" title="Collapse content" style="display: none;">
                                ${collapseIcon}
                              </button>
                              <div class="content-wrapper">${escapeHtml(trajectory.content.trim())}</div>
                            </div>
                          </td>
                        </tr>
                      `
        }

        // Fallback for unknown trajectory format
        return `
                      <tr data-testid="trajectory-unknown-row-${index}">
                        <td class="timestamp-col">-</td>
                        <td class="role-col">UNKNOWN</td>
                        <td class="content-col">
                          <div class="content-cell-container">
                            <button class="content-toggle-btn expand-btn" onclick="toggleContentExpansion(this)" title="Expand content">
                              ${expandIcon}
                            </button>
                            <button class="content-toggle-btn collapse-btn" onclick="toggleContentExpansion(this)" title="Collapse content" style="display: none;">
                              ${collapseIcon}
                            </button>
                            <div class="content-wrapper">Unknown trajectory format</div>
                          </div>
                        </td>
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