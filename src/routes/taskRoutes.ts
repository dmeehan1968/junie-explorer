import express from 'express';
import { getIssue, getTask } from '../utils/appState.js';
import { formatMilliseconds, formatSeconds } from '../utils/timeUtils.js';
import { Step, Metrics } from '../matterhorn.js';
import { marked } from 'marked';

const router = express.Router();

// Helper function to calculate summary data for a task's steps
function calculateStepSummary(steps: Step[]): Metrics {
  return steps.reduce((acc: Metrics, step: Step) => {
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
}

// Function to prepare data for the metrics over time graph
function prepareStepGraphData(steps: Step[]): { labels: string[], datasets: any[], timeUnit: string, stepSize: number } {
  // Use the actual timestamps from the step data
  const stepTimes = steps.map(step => step.created);

  // Find min and max dates
  const minDate = stepTimes.length > 0 ? new Date(Math.min(...stepTimes.map(date => date.getTime()))) : new Date();
  const maxDate = stepTimes.length > 0 ? new Date(Math.max(...stepTimes.map(date => date.getTime()))) : new Date();

  // Calculate the date range in milliseconds
  const dateRange = maxDate.getTime() - minDate.getTime();

  // Determine the appropriate time unit based on the date range
  let timeUnit = 'minute'; // default for task steps (usually short timeframe)
  let stepSize = 1;

  // Constants for time calculations
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  // Minimum number of labels we want to display
  const MIN_LABELS = 5;

  if (dateRange < MINUTE * 5) {
    timeUnit = 'second';
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (1000 * MIN_LABELS)));
  } else if (dateRange < HOUR) {
    timeUnit = 'minute';
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (MINUTE * MIN_LABELS)));
  } else if (dateRange < DAY) {
    timeUnit = 'hour';
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (HOUR * MIN_LABELS)));
  } else if (dateRange < WEEK) {
    timeUnit = 'day';
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (DAY * MIN_LABELS)));
  } else if (dateRange < MONTH) {
    timeUnit = 'week';
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (WEEK * MIN_LABELS)));
  } else if (dateRange < YEAR) {
    timeUnit = 'month';
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (MONTH * MIN_LABELS)));
  } else {
    timeUnit = 'year';
    // Calculate step size to ensure at least MIN_LABELS labels
    stepSize = Math.max(1, Math.floor(dateRange / (YEAR * MIN_LABELS)));
  }

  // Create datasets for cost and aggregate tokens
  const costData = steps.map(step => ({
    x: step.created.toISOString(),
    y: step.metrics.cost
  }));

  const tokenData = steps.map(step => ({
    x: step.created.toISOString(),
    y: step.metrics.inputTokens + step.metrics.outputTokens + step.metrics.cacheTokens
  }));

  const datasets = [
    {
      label: 'Cost',
      data: costData,
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y'
    },
    {
      label: 'Tokens (Input + Output + Cache)',
      data: tokenData,
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1'
    }
  ];

  return {
    labels: steps.map(step => step.created.toISOString()),
    datasets,
    timeUnit,
    stepSize,
  };
}

// Generate HTML for metrics table headers (used only for steps table, not for totals)
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

// Function to generate HTML for step totals table
const generateStepTotalsTable = (summaryData: Metrics): string => {
  // Calculate total time as sum of build time, model time, artifact time and model cached time
  const totalTime = summaryData.buildTime + summaryData.modelTime/1000 + summaryData.artifactTime + summaryData.modelCachedTime/1000;

  return `
  <table class="step-totals-table">
    <tbody>
      <tr>
        <td>Input Tokens: ${summaryData.inputTokens}</td>
        <td>Output Tokens: ${summaryData.outputTokens}</td>
        <td>Cache Tokens: ${summaryData.cacheTokens}</td>
        <td>Cost: ${summaryData.cost.toFixed(4)}</td>
        <td>Total Time: ${formatSeconds(totalTime)}</td>
      </tr>
    </tbody>
  </table>
`;
};

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
            <div class="issue-created">Created: ${new Date(issue.created).toLocaleString()}</div>
            <div class="issue-state state-${issue.state.toLowerCase()}">${issue.state}</div>
          </div>

          <ul class="task-list">
            ${issue.tasks.length > 0 
              ? issue.tasks.map(task => {
                  // Calculate step totals for this task
                  const stepTotals = calculateStepSummary(task.steps);

                  return `
                    <li class="task-item">
                      <div class="task-header">
                        <div class="task-id">${task.id.index === 0 ? 'Initial Request' : `Follow up ${task.id.index}`}</div>
                        <div class="task-date">Created: ${new Date(task.created).toLocaleString()}</div>
                      </div>
                      <a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${task.id.index}" class="task-link">
                        <div class="task-artifact">Artifact Path: ${task.artifactPath}</div>
                        ${task.context?.description ? `<div class="task-description">${marked(task.context.description)}</div>` : ''}
                      </a>
                      <div class="task-details">
                        ${generateStepTotalsTable(stepTotals)}
                      </div>
                    </li>
                  `;
                }).join('')
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
    const summaryData = calculateStepSummary(task.steps);

    // Prepare graph data
    const graphData = prepareStepGraphData(task.steps);

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task ${task.id.index} Steps</title>
        <link rel="stylesheet" href="/css/style.css">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        ${task.steps.length > 0 
          ? `<script>
              // Define the chart data as a global variable
              window.chartData = ${JSON.stringify(graphData)};
            </script>`
          : ''
        }
        <script src="/js/taskStepGraph.js"></script>
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
            <h1>Steps for Task ${task.id.index}</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/">JetBrains</a></li>
              <li class="breadcrumb-item"><a href="/ide/${encodeURIComponent(ideName)}">${ideName} Projects</a></li>
              <li class="breadcrumb-item"><a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}">${projectName} Issues</a></li>
              <li class="breadcrumb-item"><a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}">Tasks</a></li>
              <li class="breadcrumb-item active">Steps for Task ${task.id.index}</li>
            </ol>
          </nav>

          <div class="task-details">
            <div class="task-created">Created: ${new Date(task.created).toLocaleString()}</div>
            <div class="task-artifact">Artifact Path: ${task.artifactPath}</div>
            ${task.context?.description ? `<div class="task-description">${marked(task.context.description)}</div>` : ''}
          </div>

          ${task.steps.length > 0 
            ? `<div class="graph-container">
                <canvas id="stepMetricsChart"></canvas>
              </div>`
            : ''
          }

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
                  ${task.steps.map((step, index) => `
                    <tr>
                      <td>
                        <div class="title-container">
                          ${index + 1}
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
