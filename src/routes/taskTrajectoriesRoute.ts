import express from 'express'
import fs from 'fs-extra'
import path from 'path'
import { marked } from 'marked'
import { JetBrains } from "../jetbrains.js"
import { escapeHtml } from "../utils/escapeHtml.js"

const router = express.Router()

// Task trajectories download route
router.get('/project/:projectName/issue/:issueId/task/:taskId/trajectories/download', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)
    const task = issue?.getTaskById(taskId)

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
router.get('/project/:projectName/issue/:issueId/task/:taskId/trajectories', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)
    const task = issue?.getTaskById(taskId)

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
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>Junie Explorer: Task ${task.id} Trajectories</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
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
              <div class="task-created">Created: ${new Date(task.created).toLocaleString()}</div>
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
                          <td class="content-col"><div class="content-wrapper">Error parsing trajectory: ${escapeHtml(String(trajectory.error))}</div></td>
                        </tr>
                      `
        }

        // Type guard to ensure we have a valid trajectory
        if ('timestamp' in trajectory && 'role' in trajectory && 'content' in trajectory) {
          return `
                        <tr data-testid="trajectory-row-${index}" class="role-${trajectory.role}">
                          <td class="timestamp-col">${trajectory.timestamp.toLocaleString()}</td>
                          <td class="role-col">${escapeHtml(trajectory.role)}</td>
                          <td class="content-col"><div class="content-wrapper">${escapeHtml(trajectory.content.trim())}</div></td>
                        </tr>
                      `
        }

        // Fallback for unknown trajectory format
        return `
                      <tr data-testid="trajectory-unknown-row-${index}">
                        <td class="timestamp-col">-</td>
                        <td class="role-col">UNKNOWN</td>
                        <td class="content-col"><div class="content-wrapper">Unknown trajectory format</div></td>
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