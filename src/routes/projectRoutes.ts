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

// Function to generate HTML for project metrics table
const generateProjectMetricsTable = (project: { name: string, issues: Issue[] }): string => {
  if (project.issues.length === 0) {
    return '';
  }

  const projectMetrics = calculateProjectMetrics(project.issues);
  // Calculate total time as sum of build time, model time, artifact time and model cached time
  const totalTime = projectMetrics.buildTime + projectMetrics.modelTime/1000 + projectMetrics.artifactTime + projectMetrics.modelCachedTime/1000;

  return `
  <div class="project-metrics">
    <div class="issue-count">Issues: ${project.issues.length}</div>
    <table class="step-totals-table">
      <tbody>
        <tr>
          <td>Input Tokens: ${projectMetrics.inputTokens}</td>
          <td>Output Tokens: ${projectMetrics.outputTokens}</td>
          <td>Cache Tokens: ${projectMetrics.cacheTokens}</td>
          <td>Cost: ${projectMetrics.cost.toFixed(4)}</td>
          <td>Total Time: ${formatSeconds(totalTime)}</td>
        </tr>
      </tbody>
    </table>
  </div>
`;
};

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

          <ul class="project-list">
            ${ide.projects.length > 0 
              ? ide.projects.map(project => `
                <li class="project-item">
                  <a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(project.name)}" class="project-link">
                    <div class="project-name">${project.name}</div>
                  </a>
                  ${generateProjectMetricsTable(project)}
                </li>
              `).join('')
              : '<li>No projects found for this IDE</li>'
            }
          </ul>
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
