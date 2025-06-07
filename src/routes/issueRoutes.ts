import express from 'express';
import { getProject } from '../utils/appState.js';
import { formatMilliseconds, formatSeconds } from '../utils/timeUtils.js';
import { Step, Metrics, Task, Issue } from '../matterhorn.js'

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

// Function to generate HTML for issue metrics table
const generateIssueMetricsTable = (issue: Issue): string => {
  const issueMetrics = calculateIssueSummary(issue.tasks);
  // Calculate total time as sum of build time, model time, artifact time and model cached time
  const totalTime = issueMetrics.buildTime + issueMetrics.modelTime/1000 + issueMetrics.artifactTime + issueMetrics.modelCachedTime/1000;

  return `
  <table class="step-totals-table">
    <tbody>
      <tr>
        <td>${issue.created.toLocaleString()}</td>
        <td>Input Tokens: ${issueMetrics.inputTokens}</td>
        <td>Output Tokens: ${issueMetrics.outputTokens}</td>
        <td>Cache Tokens: ${issueMetrics.cacheTokens}</td>
        <td>Cost: ${issueMetrics.cost.toFixed(4)}</td>
        <td>Total Time: ${formatSeconds(totalTime)}</td>
      </tr>
    </tbody>
  </table>
`;
};

// Function to prepare data for the cost over time graph
function prepareGraphData(issues: Issue[]): { labels: string[], datasets: any[], timeUnit: string, stepSize: number } {
  // Sort issues by creation date
  const sortedIssues = [...issues].sort((a, b) => a.created.getTime() - b.created.getTime());

  // Find min and max dates
  const minDate = sortedIssues.length > 0 ? sortedIssues[0].created : new Date();
  const maxDate = sortedIssues.length > 0 ? sortedIssues[sortedIssues.length - 1].created : new Date();

  // Calculate the date range in milliseconds
  const dateRange = maxDate.getTime() - minDate.getTime();

  // Determine the appropriate time unit based on the date range
  let timeUnit = 'day'; // default
  let stepSize = 1;

  // Constants for time calculations
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  if (dateRange < DAY) {
    timeUnit = 'hour';
  } else if (dateRange < DAY*2) {
    timeUnit = 'hour';
    stepSize = 3;
  } else if (dateRange < WEEK) {
    timeUnit = 'day';
  } else if (dateRange < MONTH) {
    timeUnit = 'week';
  } else if (dateRange < YEAR) {
    timeUnit = 'month';
  } else {
    timeUnit = 'year';
  }

  // Create datasets for each issue
  const datasets = sortedIssues.map((issue, index) => {
    const issueMetrics = calculateIssueSummary(issue.tasks);

    // Generate a color based on index
    const hue = (index * 137) % 360; // Use golden ratio to spread colors
    const color = `hsl(${hue}, 70%, 60%)`;

    return {
      label: issue.name,
      data: [{ x: issue.created.toISOString(), y: issueMetrics.cost }],
      borderColor: color,
      backgroundColor: color,
      fill: false,
      tension: 0.1
    };
  });

  return {
    labels: [minDate.toISOString(), maxDate.toISOString()],
    datasets,
    timeUnit,
    stepSize,
  };
}

// Project issues page route
router.get('/ide/:ideName/project/:projectName', (req, res) => {
  try {
    const { ideName, projectName } = req.params;
    const project = getProject(ideName, projectName);

    if (!project) {
      return res.status(404).send('Project not found');
    }

    // Prepare graph data
    const graphData = prepareGraphData(project.issues);

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} Issues</title>
        <link rel="stylesheet" href="/css/style.css">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script>
          // Define a minimal locale object to satisfy the adapter requirements
          window._locale = {
            code: 'en-US',
            formatLong: {
              date: (options) => {
                return options.width === 'short' ? 'MM/dd/yyyy' : 'MMMM d, yyyy';
              }
            },
            localize: {
              month: (n) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][n],
              day: (n) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][n],
              ordinalNumber: (n) => n
            },
            formatRelative: () => '',
            match: {},
            options: { weekStartsOn: 0 }
          };
        </script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <script>
          // Define the chart data as a global variable
          window.chartData = ${JSON.stringify(graphData)};
        </script>
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

          // Initialize the cost over time graph when the page loads
          window.onload = function() {
            // Add a small delay to ensure all scripts are loaded
            setTimeout(function() {
            try {
              const ctx = document.getElementById('costOverTimeChart').getContext('2d');
              // Use a global variable to avoid JSON parsing issues
              const chartData = window.chartData;
              const timeUnit = chartData.timeUnit;
              const stepSize = chartData.stepSize;

              // Create chart configuration
              const config = {
                type: 'line',
                data: {
                  labels: chartData.labels,
                  datasets: chartData.datasets.map(dataset => ({
                    label: dataset.label,
                    data: dataset.data,
                    borderColor: dataset.borderColor,
                    backgroundColor: dataset.backgroundColor,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointHitRadius: 10,
                    borderWidth: 2
                  }))
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  elements: {
                    point: {
                      radius: 4,
                      hitRadius: 10,
                      hoverRadius: 6
                    },
                    line: {
                      tension: 0.1
                    }
                  },
                  scales: {
                    x: {
                      type: 'time',
                      time: {
                        unit: timeUnit,
                        stepSize: stepSize,
                        displayFormats: {
                          hour: 'HH:mm',
                          day: 'MMM d',
                          week: 'MMM d',
                          month: 'MMM yyyy',
                          year: 'yyyy'
                        },
                        tooltipFormat: 'MMM d, yyyy HH:mm'
                      },
                      title: {
                        display: true,
                        text: 'Date'
                      },
                      adapters: {
                        date: {
                          locale: window._locale
                        }
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Cost ($)'
                      },
                      beginAtZero: true
                    }
                  },
                  plugins: {
                    title: {
                      display: true,
                      text: 'Issue Cost Over Time',
                      font: {
                        size: 16
                      }
                    },
                    legend: {
                      display: false
                    }
                  }
                }
              };

              // Create the chart
              new Chart(ctx, config);
            } catch (error) {
              console.error('Error creating chart:', error);
            }
            }, 100); // 100ms delay
          };
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

          <div class="graph-container">
            <canvas id="costOverTimeChart"></canvas>
          </div>

          <ul class="issue-list">
            ${project.issues.length > 0 
              ? project.issues.map(issue => {
                  return `
                    <li class="issue-item">
                      <a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issue.id)}" class="issue-link">
                        <div class="issue-container">
                          <div class="issue-name">${issue.name}</div>
                          <div class="issue-state state-${issue.state.toLowerCase()}">${issue.state}</div>
                        </div>
                      </a>
                      <div class="issue-metrics">
                        ${generateIssueMetricsTable(issue)}
                      </div>
                    </li>
                  `;
                }).join('')
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
