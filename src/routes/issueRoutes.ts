import express from 'express';
import { getProjectWithIssues } from '../utils/ideUtils.js';

const router = express.Router();

// Project issues page route
router.get('/ide/:ideName/project/:projectName', async (req, res) => {
  try {
    const { ideName, projectName } = req.params;
    const project = await getProjectWithIssues(ideName, projectName);

    if (!project) {
      return res.status(404).send('Project not found');
    }

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} Issues</title>
        <link rel="stylesheet" href="/css/style.css">
      </head>
      <body>
        <div class="container">
          <h1>${project.name} Issues</h1>
          <p><a href="/ide/${encodeURIComponent(ideName)}" class="back-link">Back to Projects</a></p>

          <ul class="issue-list">
            ${project.issues.length > 0 
              ? project.issues.map(issue => `
                <li class="issue-item">
                  <div class="issue-header">
                    <div class="issue-name">${issue.name}</div>
                    <div class="issue-date">${issue.created.toLocaleDateString()}</div>
                  </div>
                  <div class="issue-state state-${issue.state.toLowerCase()}">${issue.state}</div>
                </li>
              `).join('')
              : '<li>No issues found for this project</li>'
            }
          </ul>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error generating issues page:', error);
    res.status(500).send('An error occurred while generating the issues page');
  }
});

export default router;
