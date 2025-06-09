import express from 'express';
import { getIDE } from '../utils/appState.js';
import { formatSeconds } from '../utils/timeUtils.js';
import { calculateIssueSummary, calculateProjectMetrics } from '../utils/metricsUtils.js';
import { Metrics, Step, Task, Issue } from '../matterhorn.js';

const router = express.Router();



// Projects page route
router.get('/ide/:ideName', (req, res) => {
  try {
    const { ideName } = req.params;
    const ide = getIDE(ideName);

    if (!ide) {
      return res.status(404).send('IDE not found');
    }

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${ide.name} Projects</title>
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
            <h1>${ide.name}</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/">JetBrains</a></li>
              <li class="breadcrumb-item active">${ide.name}</li>
            </ol>
          </nav>

          <table class="project-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Issue Count</th>
                <th>Input Tokens</th>
                <th>Output Tokens</th>
                <th>Cache Tokens</th>
                <th>Cost</th>
                <th>Total Time</th>
              </tr>
            </thead>
            <tbody>
            ${ide.projects.length > 0 
              ? ide.projects.map(project => {
                  const issueCount = project.issues.length;
                  if (issueCount === 0) {
                    return `
                      <tr>
                        <td><a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(project.name)}">${project.name}</a></td>
                        <td>0</td>
                        <td colspan="5">&nbsp;</td>
                      </tr>
                    `;
                  } else {
                    const projectMetrics = calculateProjectMetrics(project.issues);
                    const totalTime = projectMetrics.buildTime + projectMetrics.modelTime/1000 + projectMetrics.artifactTime + projectMetrics.modelCachedTime/1000;
                    return `
                      <tr>
                        <td><a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(project.name)}">${project.name}</a></td>
                        <td>${issueCount}</td>
                        <td>${projectMetrics.inputTokens}</td>
                        <td>${projectMetrics.outputTokens}</td>
                        <td>${projectMetrics.cacheTokens}</td>
                        <td>${projectMetrics.cost.toFixed(4)}</td>
                        <td>${formatSeconds(totalTime)}</td>
                      </tr>
                    `;
                  }
                }).join('')
              : '<tr><td colspan="7">No projects found for this IDE</td></tr>'
            }
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error generating projects page:', error);
    res.status(500).send('An error occurred while generating the projects page');
  }
});

export default router;
