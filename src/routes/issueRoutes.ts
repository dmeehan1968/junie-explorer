import express from 'express';
import { getProject, getIDEIcon } from '../utils/appState.js';
import { formatSeconds } from '../utils/timeUtils.js';
import { calculateIssueSummary } from '../utils/metricsUtils.js';
import { Issue } from '../matterhorn.js'

const router = express.Router();

// Function to generate HTML for issue metrics table
const generateIssueMetricsTable = (issue: Issue): string => {
  const issueMetrics = calculateIssueSummary(issue.tasks);
  // Calculate total time as sum of build time, model time, artifact time and model cached time
  const totalTime = issueMetrics.buildTime + issueMetrics.modelTime/1000 + issueMetrics.artifactTime + issueMetrics.modelCachedTime/1000;

  return `
  <table class="step-totals-table">
    <tbody>
      <tr>
        <td>${new Date(issue.created).toLocaleString()}</td>
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
  const sortedIssues = [...issues].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

  // Find min and max dates
  const minDate = sortedIssues.length > 0 ? new Date(sortedIssues[0].created) : new Date();
  const maxDate = sortedIssues.length > 0 ? new Date(sortedIssues[sortedIssues.length - 1].created) : new Date();

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
      data: [{ x: issue.created, y: issueMetrics.cost }],
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
router.get('/project/:projectName/issues', (req, res) => {
  try {
    const { projectName } = req.params;
    const project = getProject(projectName);

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
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        ${project.issues.length > 0 
          ? `<script>
              // Define the chart data as a global variable
              window.chartData = ${JSON.stringify(graphData)};
            </script>`
          : ''
        }
        <script src="/js/issueGraph.js"></script>
        <script src="/js/ideFilters.js"></script>
        <style>
          .ide-icons {
            display: flex;
            gap: 10px;
            margin: 15px 0;
          }
          .ide-icon {
            width: 30px;
            height: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>Project: ${project.name}</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/">Projects</a></li>
              <li class="breadcrumb-item"><a href="/project/${encodeURIComponent(projectName)}">${project.name}</a></li>
              <li class="breadcrumb-item active">Issues</li>
            </ol>
          </nav>

          <div class="ide-icons">
            ${project.ides.map(ide => `
              <img src="${getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="ide-icon" />
            `).join('')}
          </div>

          ${project.issues.length > 0 
            ? `<div class="graph-container">
                <canvas id="costOverTimeChart"></canvas>
              </div>`
            : ''
          }

          <ul class="issue-list">
            ${project.issues.length > 0 
              ? project.issues.map(issue => {
                  return `
                    <li class="issue-item">
                      <a href="/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issue.id.id)}" class="issue-link">
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
