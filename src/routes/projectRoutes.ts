import express from 'express'
import { Issue } from "../Issue.js"
import { JetBrains } from "../jetbrains.js"
import { Project } from "../Project.js"
import { Breadcrumb } from '../components/breadcrumb.js'
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { ReloadButton } from '../components/reloadButton.js'
import { getStatusBadge } from "../components/statusBadge.js"
import { formatElapsedTime, formatNumber, formatSeconds } from '../utils/timeUtils.js'
import { ThemeSwitcher } from '../components/themeSwitcher.js'
import { VersionBanner } from '../components/versionBanner.js'

const router = express.Router()

// Function to generate HTML for combined issues table with project summary footer
const generateIssuesTable = async (project: Project, locale: string | undefined): Promise<string> => {
  const issuesCount = (await project.issues).size
  const hasMetrics = (await project.metrics).metricCount > 0

  if (issuesCount === 0) {
    return '<p class="p-4 text-center text-base-content/70" data-testid="no-issues-message">No issues found for this project</p>'
  }

  const sortedIssues = [...(await project.issues).values()].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  const oldestIssue = sortedIssues[sortedIssues.length - 1]
  const newestIssue = sortedIssues[0]
  const elapsedTimeMs = new Date(newestIssue.created).getTime() - new Date(oldestIssue.created).getTime()
  const elapsedTimeSec = elapsedTimeMs / 1000
  const metrics = await project.metrics
  return `
  <div class="mb-5 bg-base-200 rounded shadow-sm p-4">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold text-primary">${issuesCount} Project Issue${issuesCount !== 1 ? 's' : ''}</h3>
      <span class="font-bold text-base-content" data-testid="summary-elapsed-time">Elapsed Time: ${formatElapsedTime(elapsedTimeSec)}</span>
    </div>
    <div class="overflow-x-auto">
      ${!hasMetrics 
        ? `
          <div class="bg-base-content/10 p-4 rounded mb-4">
            This project does not contain token or cost metrics, which means that it is most likely created by the 
            Junie General Availability (GA) plugin which does not collect metrics.
          </div>
        `
        : ``
      }
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm opacity-70">Select at least two issues to enable compare</div>
        <button id="compareBtn" class="btn btn-primary btn-sm" disabled data-testid="compare-button">Compare</button>
      </div>
      <table class="table table-zebra w-full bg-base-100" data-testid="issues-table">
        <thead>
          <tr class="!bg-base-200">
            <th class="w-10 text-center align-middle"><input type="checkbox" id="selectAllIssues" class="checkbox checkbox-sm" aria-label="Select all issues" /></th>
            <th class="text-left w-2/5 whitespace-nowrap">Issue Description</th>
            <th class="text-left whitespace-nowrap">Timestamp</th>
            ${hasMetrics 
              ? `<th class="text-right whitespace-nowrap">Input Tokens</th>
                <th class="text-right whitespace-nowrap">Output Tokens</th>
                <th class="text-right whitespace-nowrap">Cache Tokens</th>
                <th class="text-right whitespace-nowrap">Cost</th>
               ` 
              : ''}
            <th class="text-right whitespace-nowrap">Time</th>
            <th class="text-right whitespace-nowrap">Status</th>
          </tr>
          <tr class="!bg-base-200 font-bold text-base-content">
            <td></td>
            <td class="text-left whitespace-nowrap" data-testid="header-summary-label">Project Summary</td>
            <td class="text-left whitespace-nowrap"></td>
            ${hasMetrics
              ? `
                <td class="text-right whitespace-nowrap" data-testid="header-summary-input-tokens">${formatNumber(metrics.inputTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="header-summary-output-tokens">${formatNumber(metrics.outputTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="header-summary-cache-tokens">${formatNumber(metrics.cacheTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="header-summary-cost">${metrics.cost.toFixed(2)}</td>
              `
              : ``
            }
            <td class="text-right whitespace-nowrap" data-testid="header-summary-total-time">${formatSeconds(metrics.time / 1000)}</td>
            <td class="text-right whitespace-nowrap"></td>
          </tr>
        </thead>
        <tbody>
          ${(await Promise.all(sortedIssues.map(async issue => `
          <tr class="cursor-pointer hover:!bg-accent transition-all duration-200 hover:translate-x-1 border-transparent hover:shadow-md" onclick="window.location.href='/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}'">
            <td class="text-center align-top py-3 px-2">
              <input type="checkbox" class="checkbox checkbox-sm issue-select" aria-label="Select issue for comparison" 
                data-issue-id="${escapeHtml(issue.id)}"
                data-issue-name="${escapeHtml(issue.name)}"
                data-input-tokens="${(await issue.metrics).inputTokens}"
                data-output-tokens="${(await issue.metrics).outputTokens}"
                data-cache-tokens="${(await issue.metrics).cacheTokens}"
                data-time-ms="${(await issue.metrics).time}"
                onclick="event.stopPropagation()"
              />
            </td>
            <td class="text-left font-bold text-primary hover:text-primary-focus whitespace-normal break-words w-2/5 align-top py-3 px-2" data-testid="issue-description">
              ${escapeHtml(issue.name)}
            </td>
            <td class="text-left whitespace-nowrap" data-testid="issue-timestamp">${new Date(issue.created).toLocaleString(locale)}</td>
            ${hasMetrics 
              ? `
                <td class="text-right whitespace-nowrap" data-testid="issue-input-tokens">${formatNumber((await issue.metrics).inputTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="issue-output-tokens">${formatNumber((await issue.metrics).outputTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="issue-cache-tokens">${formatNumber((await issue.metrics).cacheTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="issue-cost">${(await issue.metrics).cost.toFixed(4)}</td>
              ` 
              : ``
            }
            <td class="text-right whitespace-nowrap" data-testid="issue-total-time">${formatSeconds((await issue.metrics).time / 1000)}</td>
            <td class="text-right whitespace-nowrap" data-testid="issue-status">
              ${getStatusBadge(issue.state)}
            </td>
          </tr>
          `))).join('')}
        </tbody>
        <tfoot>
          <tr class="!bg-base-200 font-bold text-base-content">
            <td></td>
            <td class="text-left whitespace-nowrap" data-testid="summary-label">Project Summary</td>
            <td class="text-left whitespace-nowrap"></td>
            ${hasMetrics 
              ? `
                <td class="text-right whitespace-nowrap" data-testid="summary-input-tokens">${formatNumber(metrics.inputTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="summary-output-tokens">${formatNumber(metrics.outputTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="summary-cache-tokens">${formatNumber(metrics.cacheTokens)}</td>
                <td class="text-right whitespace-nowrap" data-testid="summary-cost">${metrics.cost.toFixed(2)}</td>
              `
              : ``
            }
            <td class="text-right whitespace-nowrap" data-testid="summary-total-time">${formatSeconds(metrics.time / 1000)}</td>
            <td class="text-right whitespace-nowrap"></td>
          </tr>
        </tfoot>
      </table>

      <!-- Compare Modal -->
      <div id="compareModal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
        <div class="bg-base-100 w-[95vw] h-[90vh] rounded-lg shadow-lg relative p-4" role="dialog" aria-modal="true">
          <button id="closeCompareModal" class="btn btn-sm btn-circle absolute right-3 top-3" aria-label="Close">✕</button>
          <div class="mb-3 flex items-center gap-4">
            <span class="font-semibold">Metric:</span>
            ${hasMetrics ? `
            <label class="label cursor-pointer gap-2"><input type="radio" name="metricChoice" value="input" class="radio radio-sm" checked><span>Input Tokens</span></label>
            <label class="label cursor-pointer gap-2"><input type="radio" name="metricChoice" value="output" class="radio radio-sm"><span>Output Tokens</span></label>
            <label class="label cursor-pointer gap-2"><input type="radio" name="metricChoice" value="cache" class="radio radio-sm"><span>Cache Tokens</span></label>
            `: ''}
            <label class="label cursor-pointer gap-2"><input type="radio" name="metricChoice" value="time" class="radio radio-sm" ${hasMetrics ? '' : 'checked'}><span>Time</span></label>
          </div>
          <div class="h-[80%]"><canvas id="compareChart" class="w-full h-full"></canvas></div>
        </div>
      </div>

      <script>
        (function(){
          const selectAll = document.getElementById('selectAllIssues');
          const compareBtn = document.getElementById('compareBtn');
          const modal = document.getElementById('compareModal');
          const closeBtn = document.getElementById('closeCompareModal');

          function getSelected(){
            return Array.from(document.querySelectorAll('.issue-select:checked')).map(cb => ({
              id: cb.dataset.issueId,
              label: cb.dataset.issueName,
              input: Number(cb.dataset.inputTokens||0),
              output: Number(cb.dataset.outputTokens||0),
              cache: Number(cb.dataset.cacheTokens||0),
              time: Number(cb.dataset.timeMs||0)
            }));
          }

          function updateButton(){
            const count = getSelected().length;
            compareBtn.disabled = count < 2;
          }

          if (selectAll){
            selectAll.addEventListener('change', () => {
              document.querySelectorAll('.issue-select').forEach(cb => {
                cb.checked = selectAll.checked;
              });
              updateButton();
            });
          }

          document.addEventListener('change', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('issue-select')){
              updateButton();
            }
          });

          function openModal(){
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            renderChart();
          }
          function closeModal(){
            modal.classList.add('hidden');
            modal.classList.remove('flex');
          }

          compareBtn.addEventListener('click', openModal);
          closeBtn.addEventListener('click', closeModal);
          modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
          });

          document.addEventListener('change', (e) => {
            if (e.target && e.target.name === 'metricChoice'){
              renderChart();
            }
          });

          let chartInstance;
          function renderChart(){
            const ctx = document.getElementById('compareChart').getContext('2d');
            const selected = getSelected();
            const metric = (document.querySelector('input[name="metricChoice"]:checked')||{value:'time'}).value;
            const labels = selected.map(s => s.label);
            const rawData = selected.map(s => s[metric]);
            const data = metric === 'time' ? rawData.map(v => v / 1000) : rawData;

            const dsLabel = metric === 'input' ? 'Input Tokens' : metric === 'output' ? 'Output Tokens' : metric === 'cache' ? 'Cache Tokens' : 'Time (s)';
            const yAxisLabel = (metric === 'input' || metric === 'output' || metric === 'cache') ? 'Tokens' : 'Time (s)';

            if (chartInstance){ chartInstance.destroy(); }
            if (window.Chart){
              chartInstance = new window.Chart(ctx, {
                type: 'bar',
                data: {
                  labels,
                  datasets: [{
                    label: dsLabel,
                    data,
                    backgroundColor: labels.map((_, i) => 'hsl(' + ((i*137)%360) + ',70%,60%)')
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true } },
                  scales: { y: { beginAtZero: true, title: { display: true, text: yAxisLabel } } }
                }
              });
            } else {
              // Fallback: simple text
              ctx.canvas.parentElement.innerHTML = '<div class="p-4">Chart library not available.</div>';
            }
          }

          // Initialize button state
          updateButton();
        })();
      </script>
    </div>
  </div>
`
}

// Function to prepare data for the cost over time graph
async function prepareGraphData(issues: Issue[]): Promise<{ labels: string[], datasets: any[], timeUnit: string, stepSize: number }> {
  // Sort issues by creation date
  const sortedIssues = [...issues].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())

  // Find min and max dates
  const minDate = sortedIssues.length > 0 ? new Date(sortedIssues[0].created) : new Date()
  const maxDate = sortedIssues.length > 0 ? new Date(sortedIssues[sortedIssues.length - 1].created) : new Date()

  // Calculate the date range in milliseconds
  const dateRange = maxDate.getTime() - minDate.getTime()

  // Determine the appropriate time unit based on the date range
  let timeUnit = 'day' // default
  let stepSize = 1

  // Constants for time calculations
  const HOUR = 60 * 60 * 1000
  const DAY = 24 * HOUR
  const WEEK = 7 * DAY
  const MONTH = 30 * DAY
  const YEAR = 365 * DAY

  if (dateRange < DAY) {
    timeUnit = 'hour'
  } else if (dateRange < DAY * 2) {
    timeUnit = 'hour'
    stepSize = 3
  } else if (dateRange < WEEK * 4) {
    timeUnit = 'day'
  } else if (dateRange < MONTH * 6) {
    timeUnit = 'week'
  } else if (dateRange < YEAR) {
    timeUnit = 'month'
  } else {
    timeUnit = 'year'
  }

  // Create datasets for each issue
  const datasets = await Promise.all(sortedIssues.map(async (issue, index) => {

    // Generate a color based on index
    const hue = (index * 137) % 360 // Use golden ratio to spread colors
    const color = `hsl(${hue}, 70%, 60%)`

    return {
      label: issue.name,
      data: [{ x: issue.created, y: (await issue.metrics).cost }],
      borderColor: color,
      backgroundColor: color,
      fill: false,
      tension: 0.1,
    }
  }))

  return {
    labels: [minDate.toISOString(), maxDate.toISOString()],
    datasets,
    timeUnit,
    stepSize,
  }
}

// Project issues page route
router.get('/project/:projectName', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains

  try {
    const { projectName } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    if (!project) {
      return res.status(404).send('Project not found')
    }

    const hasMetrics = (await project?.metrics).metricCount > 0

    // Prepare graph data
    const graphData = await prepareGraphData([...(await project.issues).values()])

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} Issues</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        ${(await project.issues).size > 0
      ? `<script>
              // Define the chart data as a global variable
              window.chartData = ${JSON.stringify(graphData)};
            </script>`
      : ''
    }
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/issueGraph.js"></script>
        <script src="/js/reloadPage.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer: ${project.name}</h1>
            <div class="flex items-center gap-3">
              ${ThemeSwitcher()}
              ${ReloadButton()}
            </div>
          </div>
          ${VersionBanner(jetBrains.version)}
          ${Breadcrumb({
            items: [
              { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
              { label: project.name, testId: 'breadcrumb-project-name' }
            ]
          })}

          <div class="flex gap-2 mb-5" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
            `).join('')}
          </div>

          ${hasMetrics
      ? `<div class="h-96 mb-5 p-4 bg-base-200 rounded-lg border border-base-300" data-testid="cost-over-time-graph">
                <canvas id="costOverTimeChart"></canvas>
              </div>`
      : ''
    }
          ${await generateIssuesTable(project, getLocaleFromRequest(req))}
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating issues page:', error)
    res.status(500).send('An error occurred while generating the issues page')
  }
})

export default router
