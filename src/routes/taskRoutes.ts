import express from 'express';
import { getIssue, getTask } from '../utils/appState.js';
import { formatMilliseconds, formatSeconds } from '../utils/timeUtils.js';

const router = express.Router();

// Issue tasks page route
router.get('/ide/:ideName/project/:projectName/issue/:issueId', (req, res) => {
  try {
    const { ideName, projectName, issueId } = req.params;
    const issue = getIssue(ideName, projectName, issueId);

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
            <h1>Issue: ${issue.name}</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/">JetBrains</a></li>
              <li class="breadcrumb-item"><a href="/ide/${encodeURIComponent(ideName)}">${ideName}</a></li>
              <li class="breadcrumb-item"><a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}">${projectName}</a></li>
              <li class="breadcrumb-item active">${issue.name}</li>
            </ol>
          </nav>

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
                  <a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${task.id}" class="task-link">
                    <div class="task-artifact">Artifact Path: ${task.artifactPath}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                  </a>
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

// Task steps page route
router.get('/ide/:ideName/project/:projectName/issue/:issueId/task/:taskId', (req, res) => {
  try {
    const { ideName, projectName, issueId, taskId } = req.params;
    const task = getTask(ideName, projectName, issueId, parseInt(taskId, 10));

    if (!task) {
      return res.status(404).send('Task not found');
    }

    // Calculate summary values for the footer
    const summaryData = task.steps.reduce((acc, step) => {
      acc.inputTokens += step.metrics.inputTokens;
      acc.outputTokens += step.metrics.outputTokens;
      acc.cacheTokens += step.metrics.cacheTokens;
      acc.cost += step.metrics.cost;
      acc.cachedCost += step.metrics.cachedCost;
      acc.buildTime += step.metrics.buildTime;
      acc.artifactTime += step.metrics.artifactTime;
      acc.modelTime += step.metrics.modelTime;
      acc.modelCachedTime += step.metrics.modelCachedTime;
      acc.requests += step.metrics.requests;
      acc.cachedRequests += step.metrics.cachedRequests;
      return acc;
    }, {
      inputTokens: 0,
      outputTokens: 0,
      cacheTokens: 0,
      cost: 0,
      cachedCost: 0,
      buildTime: 0,
      artifactTime: 0,
      modelTime: 0,
      modelCachedTime: 0,
      requests: 0,
      cachedRequests: 0
    });

    // Generate HTML for metrics table headers
    const metricsHeaders = `
      <th>Input Tokens</th>
      <th>Output Tokens</th>
      <th>Cache Tokens</th>
      <th>Cost</th>
      <th>Cached Cost</th>
      <th>Build Time</th>
      <th>Artifact Time</th>
      <th>Model Time</th>
      <th>Model Cached Time</th>
      <th>Requests</th>
      <th>Cached Requests</th>
    `;

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task ${task.id} Steps</title>
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
            <h1>Steps for Task ${task.id}</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/">JetBrains</a></li>
              <li class="breadcrumb-item"><a href="/ide/${encodeURIComponent(ideName)}">${ideName} Projects</a></li>
              <li class="breadcrumb-item"><a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}">${projectName} Issues</a></li>
              <li class="breadcrumb-item"><a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}">Tasks</a></li>
              <li class="breadcrumb-item active">Steps for Task ${task.id}</li>
            </ol>
          </nav>

          <div class="task-details">
            <div class="task-created">Created: ${task.created.toLocaleString()}</div>
            <div class="task-artifact">Artifact Path: ${task.artifactPath}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
          </div>

          ${task.steps.length > 0 
            ? `
              <table class="steps-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    ${metricsHeaders}
                  </tr>
                </thead>
                <tbody>
                  ${task.steps.map(step => `
                    <tr>
                      <td>
                        <div class="title-container">
                          ${step.id}
                        </div>
                      </td>
                      <td>${step.metrics.inputTokens}</td>
                      <td>${step.metrics.outputTokens}</td>
                      <td>${step.metrics.cacheTokens}</td>
                      <td>${step.metrics.cost.toFixed(4)}</td>
                      <td>${step.metrics.cachedCost.toFixed(4)}</td>
                      <td>${step.metrics.buildTime.toFixed(2)}s</td>
                      <td>${step.metrics.artifactTime.toFixed(2)}s</td>
                      <td>${formatMilliseconds(step.metrics.modelTime)}</td>
                      <td>${formatMilliseconds(step.metrics.modelCachedTime)}</td>
                      <td>${step.metrics.requests}</td>
                      <td>${step.metrics.cachedRequests}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>${summaryData.inputTokens}</strong></td>
                    <td><strong>${summaryData.outputTokens}</strong></td>
                    <td><strong>${summaryData.cacheTokens}</strong></td>
                    <td><strong>${summaryData.cost.toFixed(4)}</strong></td>
                    <td><strong>${summaryData.cachedCost.toFixed(4)}</strong></td>
                    <td><strong>${formatSeconds(summaryData.buildTime)}</strong></td>
                    <td><strong>${formatSeconds(summaryData.artifactTime)}</strong></td>
                    <td><strong>${formatMilliseconds(summaryData.modelTime)}</strong></td>
                    <td><strong>${formatMilliseconds(summaryData.modelCachedTime)}</strong></td>
                    <td><strong>${summaryData.requests}</strong></td>
                    <td><strong>${summaryData.cachedRequests}</strong></td>
                  </tr>
                </tfoot>
              </table>
            `
            : '<p>No steps found for this task</p>'
          }
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error generating steps page:', error);
    res.status(500).send('An error occurred while generating the steps page');
  }
});

export default router;
