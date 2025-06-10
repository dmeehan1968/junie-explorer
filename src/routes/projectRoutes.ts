import express from 'express';
import { getProject, getIDEIcon } from '../utils/appState.js';
import { formatSeconds } from '../utils/timeUtils.js';
import { calculateProjectMetrics } from '../utils/metricsUtils.js';

const router = express.Router();

// Project details page route
router.get('/project/:projectName', (req, res) => {
  try {
    const { projectName } = req.params;
    const project = getProject(projectName);

    if (!project) {
      return res.status(404).send('Project not found');
    }

    const issueCount = project.issues.length;
    const projectMetrics = issueCount > 0 ? calculateProjectMetrics(project.issues) : null;
    const totalTime = projectMetrics ? 
      projectMetrics.buildTime + projectMetrics.modelTime/1000 + projectMetrics.artifactTime + projectMetrics.modelCachedTime/1000 : 0;

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name}</title>
        <link rel="stylesheet" href="/css/style.css">
        <script src="/js/ideFilters.js"></script>
        <script src="/js/reloadPage.js"></script>
        <style>
          .ide-icons {
            display: flex;
            gap: 10px;
            margin-left: auto;
          }
          .ide-icon {
            width: 30px;
            height: 30px;
          }
          .project-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>${project.name}</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/">Projects</a></li>
              <li class="breadcrumb-item active">${project.name}</li>
            </ol>
          </nav>

          <div class="project-header">
            <h2>Project Details</h2>
            <div class="ide-icons">
              ${project.ides.map(ide => `
                <img src="${getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="ide-icon" />
              `).join('')}
            </div>
          </div>

          <h2>Issues</h2>
          <table class="issue-table">
            <thead>
              <tr>
                <th>Issue Name</th>
                <th>Tasks</th>
                <th>Input Tokens</th>
                <th>Output Tokens</th>
                <th>Cache Tokens</th>
                <th>Cost</th>
                <th>Total Time</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
            ${project.issues.length > 0 
              ? project.issues.map(issue => {
                  const issueMetrics = calculateProjectMetrics([issue]);
                  const issueTotalTime = issueMetrics.buildTime + issueMetrics.modelTime/1000 + issueMetrics.artifactTime + issueMetrics.modelCachedTime/1000;
                  return `
                    <tr>
                      <td><a href="/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id.id)}">${issue.name}</a></td>
                      <td>${issue.tasks.length}</td>
                      <td>${issueMetrics.inputTokens}</td>
                      <td>${issueMetrics.outputTokens}</td>
                      <td>${issueMetrics.cacheTokens}</td>
                      <td>${issueMetrics.cost.toFixed(4)}</td>
                      <td>${formatSeconds(issueTotalTime)}</td>
                      <td>${issue.state}</td>
                    </tr>
                  `;
                }).join('')
              : '<tr><td colspan="9">No issues found for this project</td></tr>'
            }
            </tbody>
          </table>

          ${projectMetrics ? `
          <div class="metrics-summary">
            <h2>Project Metrics</h2>
            <table class="metrics-table">
              <tr>
                <th>Input Tokens</th>
                <td>${projectMetrics.inputTokens}</td>
              </tr>
              <tr>
                <th>Output Tokens</th>
                <td>${projectMetrics.outputTokens}</td>
              </tr>
              <tr>
                <th>Cache Tokens</th>
                <td>${projectMetrics.cacheTokens}</td>
              </tr>
              <tr>
                <th>Cost</th>
                <td>$${projectMetrics.cost.toFixed(4)}</td>
              </tr>
              <tr>
                <th>Total Time</th>
                <td>${formatSeconds(totalTime)}</td>
              </tr>
            </table>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error generating project page:', error);
    res.status(500).send('An error occurred while generating the project page');
  }
});

export default router;
