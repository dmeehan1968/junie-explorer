import express from 'express';
import { getProject } from '../utils/appState.js';

const router = express.Router();

// Project issues page route
router.get('/ide/:ideName/project/:projectName', (req, res) => {
  try {
    const { ideName, projectName } = req.params;
    const project = getProject(ideName, projectName);

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
        <script>
          function reloadPage() {
            const button = document.getElementById('reload-button');
            if (button) {
              button.disabled = true;
              button.classList.add('loading');
              setTimeout(() => {
                window.location.href = '/refresh';
              }, 100);
            }
          }
        </script>
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>Project: ${project.name}</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/">JetBrains</a></li>
              <li class="breadcrumb-item"><a href="/ide/${encodeURIComponent(ideName)}">${ideName}</a></li>
              <li class="breadcrumb-item active">${project.name}</li>
            </ol>
          </nav>

          <ul class="issue-list">
            ${project.issues.length > 0 
              ? project.issues.map(issue => `
                <li class="issue-item">
                  <a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issue.id)}" class="issue-link">
                    <div class="issue-header">
                      <div class="issue-name">${issue.name}</div>
                      <div class="issue-date">${issue.created.toLocaleString()}</div>
                    </div>
                    <div class="issue-state state-${issue.state.toLowerCase()}">${issue.state}</div>
                  </a>
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
