import express from 'express';
import { getIssueWithTasks, getTaskWithSteps } from '../utils/ideUtils.js';
import { formatMilliseconds, formatSeconds } from '../utils/timeUtils.js';

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
router.get('/ide/:ideName/project/:projectName/issue/:issueId/task/:taskId', async (req, res) => {
  try {
    const { ideName, projectName, issueId, taskId } = req.params;
    const task = await getTaskWithSteps(ideName, projectName, issueId, parseInt(taskId, 10));

    if (!task) {
      return res.status(404).send('Task not found');
    }

    // Calculate summary values for the footer
    const summaryData = task.steps.reduce((acc, step) => {
      acc.inputTokens += step.metrics.inputTokens;
      acc.outputTokens += step.metrics.outputTokens;
      acc.cacheTokens += step.metrics.cacheTokens;
      acc.cost += step.metrics.cost;
      acc.buildTime += step.metrics.buildTime;
      acc.modelTime += step.metrics.modelTime;
      return acc;
    }, {
      inputTokens: 0,
      outputTokens: 0,
      cacheTokens: 0,
      cost: 0,
      buildTime: 0,
      modelTime: 0
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
      </head>
      <body>
        <div class="container">
          <h1>Steps for Task ${task.id}</h1>
          <p><a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}" class="back-link">Back to Tasks</a></p>

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
                    <td></td>
                    <td><strong>${formatSeconds(summaryData.buildTime)}</strong></td>
                    <td></td>
                    <td><strong>${formatMilliseconds(summaryData.modelTime)}</strong></td>
                    <td></td>
                    <td></td>
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
