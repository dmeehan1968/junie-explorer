import express from 'express';
import { getIDE } from '../utils/appState.js';
import { formatMilliseconds, formatSeconds } from '../utils/timeUtils.js';
import { Metrics, Step, Task, Issue } from '../matterhorn.js';

const router = express.Router();

// Helper function to calculate summary data for all steps in all tasks of an issue
function calculateIssueSummary(tasks: Task[]): Metrics {
  return tasks.reduce((acc: Metrics, task: Task) => {
    // Calculate metrics for each task's steps
    const taskMetrics = task.steps.reduce((stepAcc: Metrics, step: Step) => {
      stepAcc.inputTokens += step.metrics.inputTokens;
      stepAcc.outputTokens += step.metrics.outputTokens;
      stepAcc.cacheTokens += step.metrics.cacheTokens;
      stepAcc.cost += step.metrics.cost;
      stepAcc.cachedCost += step.metrics.cachedCost;
      stepAcc.buildTime += step.metrics.buildTime;
      stepAcc.artifactTime += step.metrics.artifactTime;
      stepAcc.modelTime += step.metrics.modelTime;
      stepAcc.modelCachedTime += step.metrics.modelCachedTime;
      stepAcc.requests += step.metrics.requests;
      stepAcc.cachedRequests += step.metrics.cachedRequests;
      return stepAcc;
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

    // Add task metrics to issue metrics
    acc.inputTokens += taskMetrics.inputTokens;
    acc.outputTokens += taskMetrics.outputTokens;
    acc.cacheTokens += taskMetrics.cacheTokens;
    acc.cost += taskMetrics.cost;
    acc.cachedCost += taskMetrics.cachedCost;
    acc.buildTime += taskMetrics.buildTime;
    acc.artifactTime += taskMetrics.artifactTime;
    acc.modelTime += taskMetrics.modelTime;
    acc.modelCachedTime += taskMetrics.modelCachedTime;
    acc.requests += taskMetrics.requests;
    acc.cachedRequests += taskMetrics.cachedRequests;

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
}

// Function to calculate project metrics by aggregating all issue metrics
function calculateProjectMetrics(issues: Issue[]): Metrics {
  return issues.reduce((acc: Metrics, issue: Issue) => {
    const issueMetrics = calculateIssueSummary(issue.tasks);

    acc.inputTokens += issueMetrics.inputTokens;
    acc.outputTokens += issueMetrics.outputTokens;
    acc.cacheTokens += issueMetrics.cacheTokens;
    acc.cost += issueMetrics.cost;
    acc.cachedCost += issueMetrics.cachedCost;
    acc.buildTime += issueMetrics.buildTime;
    acc.artifactTime += issueMetrics.artifactTime;
    acc.modelTime += issueMetrics.modelTime;
    acc.modelCachedTime += issueMetrics.modelCachedTime;
    acc.requests += issueMetrics.requests;
    acc.cachedRequests += issueMetrics.cachedRequests;

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
}


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
