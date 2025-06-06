import express from 'express';
import { getIssueWithTasks } from '../utils/ideUtils.js';

const router = express.Router();

// Issue tasks page route
router.get('/ide/:ideName/project/:projectName/issue/:issueId', async (req, res) => {
  try {
    const { ideName, projectName, issueId } = req.params;
    const issue = await getIssueWithTasks(ideName, projectName, issueId);

    if (!issue) {
      return res.status(404).send('Issue not found');
    }

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${issue.name} Tasks</title>
        <link rel="stylesheet" href="/css/style.css">
      </head>
      <body>
        <div class="container">
          <h1>${issue.name} Tasks</h1>
          <p><a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}" class="back-link">Back to Issues</a></p>

          <div class="issue-details">
            <div class="issue-created">Created: ${issue.created.toLocaleString()}</div>
            <div class="issue-state state-${issue.state.toLowerCase()}">${issue.state}</div>
          </div>

          <ul class="task-list">
            ${issue.tasks.length > 0 
              ? issue.tasks.map(task => `
                <li class="task-item">
                  <div class="task-header">
                    <div class="task-id">${task.id === 0 ? 'Initial Request' : `Follow up ${task.id}`}</div>
                    <div class="task-date">Created: ${task.created.toLocaleString()}</div>
                  </div>
                  <div class="task-artifact">Artifact Path: ${task.artifactPath}</div>
                  ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                </li>
              `).join('')
              : '<li>No tasks found for this issue</li>'
            }
          </ul>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error generating tasks page:', error);
    res.status(500).send('An error occurred while generating the tasks page');
  }
});

export default router;
