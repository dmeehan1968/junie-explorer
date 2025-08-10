import express from 'express'
import { JetBrains } from "../jetbrains.js"
import { Project } from '../Project.js'
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { jetBrainsPath } from '../utils/jetBrainsPath.js'
import { VersionBanner } from '../components/versionBanner.js'
import { ReloadButton } from '../components/reloadButton.js'
import { ThemeSwitcher } from '../components/themeSwitcher.js'
import { themeAttributeForHtml } from '../utils/themeCookie.js'

const router = express.Router()

// Function to prepare data for the projects graph
async function prepareProjectsGraphData(projects: Project[]): Promise<{
  datasets: Array<{
    label: string;
    data: Array<{ x: string; y: number }>;
    borderColor: string;
    backgroundColor: string;
    borderDash?: number[];
    fill: boolean;
    tension: number;
    yAxisID: string;
  }>;
  timeUnit: string;
  stepSize: number;
  projectNames: string[];
}> {
  // Group issues by day and project
  const issuesByDay: Record<string, Record<string, { cost: number; tokens: number }>> = {}
  const projectColors: Record<string, string> = {}

  // Generate a color for each project
  projects.forEach((project, index) => {
    const hue = (index * 137) % 360 // Use golden ratio to spread colors
    projectColors[project.name] = `hsl(${hue}, 70%, 60%)`
  })

  // Find min and max dates across all projects
  let minDate = new Date()
  let maxDate = new Date(0)

  // Process each project's issues
  for (const project of projects) {
    for (const [, issue] of await project.issues) {
      const date = new Date(issue.created)
      const day = date.toISOString().split('T')[0] // YYYY-MM-DD format

      if (date < minDate) minDate = date
      if (date > maxDate) maxDate = date

      if (!issuesByDay[day]) {
        issuesByDay[day] = {}
      }

      if (!issuesByDay[day][project.name]) {
        issuesByDay[day][project.name] = {
          cost: 0,
          tokens: 0,
        }
      }

      const metrics = await issue.metrics
      issuesByDay[day][project.name].cost += metrics.cost
      issuesByDay[day][project.name].tokens += metrics.inputTokens + metrics.outputTokens
    }
  }

  // Determine the appropriate time unit based on the date range
  let timeUnit: string = 'day' // default
  let stepSize: number = 1

  // Constants for time calculations
  const HOUR = 60 * 60 * 1000
  const DAY = 24 * HOUR
  const WEEK = 7 * DAY
  const MONTH = 30 * DAY
  const YEAR = 365 * DAY

  const dateRange = maxDate.getTime() - minDate.getTime()

  if (dateRange < DAY) {
    timeUnit = 'hour'
  } else if (dateRange < DAY * 2) {
    timeUnit = 'hour'
    stepSize = 3
  } else if (dateRange < MONTH) {
    // default of day
  } else if (dateRange < MONTH * 6) {
    timeUnit = 'week'
  } else if (dateRange < YEAR) {
    timeUnit = 'month'
  } else {
    timeUnit = 'year'
  }

  // Helper function to convert a date string to the appropriate timeUnit format
  function formatDateByTimeUnit(dateStr: string, timeUnit: string): string {
    const date = new Date(dateStr)

    switch (timeUnit) {
      case 'hour':
        return `${dateStr}T${date.getHours().toString().padStart(2, '0')}:00`
      case 'day':
        return dateStr // Already in YYYY-MM-DD format
      case 'week':
        // Get the first day of the week (Sunday)
        const firstDayOfWeek = new Date(date)
        firstDayOfWeek.setDate(date.getDate() - date.getDay())
        return firstDayOfWeek.toISOString().split('T')[0]
      case 'month':
        return `${dateStr.substring(0, 7)}` // YYYY-MM format
      case 'year':
        return `${dateStr.substring(0, 4)}` // YYYY format
      default:
        return dateStr
    }
  }

  // Group data by timeUnit
  function groupDataByTimeUnit(
    issuesByDay: Record<string, Record<string, { cost: number; tokens: number }>>,
    projectName: string,
    timeUnit: string,
    metricType: 'cost' | 'tokens',
  ): Array<{ x: string; y: number }> {
    const groupedData: Record<string, number> = {}

    Object.keys(issuesByDay)
      .sort() // Sort days in chronological order
      .forEach(day => {
        const value = issuesByDay[day][projectName]?.[metricType] || 0
        if (value > 0) {
          const timeUnitKey = formatDateByTimeUnit(day, timeUnit)
          groupedData[timeUnitKey] = (groupedData[timeUnitKey] || 0) + value
        }
      })

    // Convert to array format required for chart
    return Object.keys(groupedData)
      .sort()
      .map(key => ({
        x: key,
        y: groupedData[key],
      }))
  }

  // Create datasets for cost
  const costDatasets: Array<{
    label: string;
    data: Array<{ x: string; y: number }>;
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
    yAxisID: string;
  }> = projects.map(project => {
    const data = groupDataByTimeUnit(issuesByDay, project.name, timeUnit, 'cost')

    return {
      label: `${project.name} (Cost)`,
      data: data,
      borderColor: projectColors[project.name],
      backgroundColor: projectColors[project.name],
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
    }
  })

  // Create datasets for tokens
  const tokenDatasets: Array<{
    label: string;
    data: Array<{ x: string; y: number }>;
    borderColor: string;
    backgroundColor: string;
    borderDash: number[];
    fill: boolean;
    tension: number;
    yAxisID: string;
  }> = projects.map(project => {
    const data = groupDataByTimeUnit(issuesByDay, project.name, timeUnit, 'tokens')

    return {
      label: `${project.name} (Tokens)`,
      data: data,
      borderColor: projectColors[project.name],
      backgroundColor: projectColors[project.name],
      borderDash: [5, 5],
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
    }
  })

  return {
    datasets: [...costDatasets, ...tokenDatasets],
    timeUnit,
    stepSize,
    projectNames: projects.map(p => p.name),
  }
}

function ProjectMetricsChart() {
  return `
    <div class="card bg-base-100 border border-base-300 shadow mb-5">
      <div class="card-body p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="card-title">Project Metrics</h2>
          ${ProjectMetricsChartOptions()}
        </div>
        <div id="projects-graph-container" class="h-96 p-2 bg-base-200 rounded-lg hidden">
          <canvas id="projectsMetricsChart"></canvas>
        </div>
      </div>
    </div>`
}

function ProjectMetricsChartOptions() {
  return `
    <div class="flex gap-2 items-center" id="project-chart-display">
      <div class="">Show: </div>
      <div class="join">
        <input class="join-item btn btn-sm" type="radio" id="display-both" value="both" name="display-option" aria-label="Both" onchange="handleDisplayOptionChange(this)">
        <input class="join-item btn btn-sm" type="radio" id="display-cost" value="cost" name="display-option" aria-label="Cost" onchange="handleDisplayOptionChange(this)">
        <input class="join-item btn btn-sm" type="radio" id="display-tokens" value="tokens" name="display-option" aria-label="Tokens" onchange="handleDisplayOptionChange(this)">
      </div>
    </div>
  `
}

// Homepage route (now shows projects instead of IDEs)
router.get('/', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  const hasMetrics = (await jetBrains.metrics).metricCount > 0
  const locale = getLocaleFromRequest(req)
  
  try {

    const projects: Project[] = Array.from((await jetBrains.projects).values())

    // Get all unique IDE names from all projects
    const allIdes = new Set<string>()
    projects.forEach(project => {
      project.ideNames.forEach(ide => allIdes.add(ide))
    })

    // Sort IDE names alphabetically
    const uniqueIdes: string[] = Array.from(allIdes).sort()

    // Generate HTML
    const html: string = `
      <!DOCTYPE html>
      <html lang="en" ${themeAttributeForHtml(req.headers.cookie)}>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Junie Explorer</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <script>
          // Define the projects data as a global variable
          window.projectsData = ${JSON.stringify(projects.map(p => ({ name: p.name, ides: p.ideNames })))};
        </script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/ideFilters.js"></script>
        <script src="/js/projectSelection.js"></script>
        <script src="/js/reloadPage.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer</h1>
            <div class="flex items-center gap-3">
              ${ThemeSwitcher()}
              ${ReloadButton()}
            </div>
          </div>
          ${VersionBanner(jetBrains.version)}
          <p class="mb-5 text-base-content/70" data-testid="logs-directory-path">Projects found in: ${jetBrainsPath}</p>

          ${!hasMetrics
            ? `
                <div class="bg-base-content/10 p-4 rounded mb-4">
                  The Junie logs do not contain token or cost metrics, which means that the projects were most
                  likely created by the Junie General Availability (GA) plugin which does not collect metrics.
                </div>
              `
            : ``
          }

          <div class="flex flex-wrap gap-3 mb-5 p-3 bg-base-200 rounded" data-testid="ide-filter-toolbar">
            <div class="font-medium text-base-content flex items-center">Filter by IDE</div>
            ${uniqueIdes.map(ide => `
              <div class="ide-filter cursor-pointer transition-all duration-300 p-1 rounded hover:bg-base-300" data-testid="ide-filter" data-ide="${ide}" onclick="toggleIdeFilter(this)">
                <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
              </div>
            `).join('')}
          </div>

          ${hasMetrics ? ProjectMetricsChart() : ''}

          <div class="overflow-x-auto">
            <table class="table w-full" id="projects-table">
              <thead>
                <tr>
                  <th class="w-12 text-center">
                    ${hasMetrics ? `<input type=\"checkbox\" id=\"select-all-projects\" onchange=\"toggleSelectAllProjects()\" class=\"checkbox checkbox-primary checkbox-sm\" title=\"Select All\">` : ''}
                  </th>
                  <th>
                    <div class="flex items-center gap-2">
                      <span>Name</span>
                      <button class="btn btn-ghost btn-xs" id="sort-name-btn" onclick="toggleNameSort()" title="Toggle sort" aria-label="Toggle sort">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="3" y="5" width="6" height="4" rx="1" fill="currentColor"/><rect x="3" y="10" width="10" height="4" rx="1" fill="currentColor"/><rect x="3" y="15" width="14" height="4" rx="1" fill="currentColor"/><rect x="20" y="10" width="2" height="8" rx="1" fill="currentColor"/><polygon points="21,5 23,10 19,10" fill="currentColor"/></svg>
                      </button>
                      <input type="text" id="project-search-input" data-testid="project-search" placeholder="Search projects..." oninput="filterByProjectName(this.value)" class="input input-bordered input-sm w-64 ml-2">
                    </div>
                  </th>
                  <th class="text-right whitespace-nowrap w-0">
                    <div class="flex items-center gap-2 justify-end">
                      <span>Last Updated</span>
                      <button class="btn btn-ghost btn-xs" id="sort-updated-btn" onclick="toggleUpdatedSort()" title="Toggle sort" aria-label="Toggle sort">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 8l4 4H8l4-4z" fill="currentColor"/></svg>
                      </button>
                    </div>
                  </th>
                  <th class="text-right whitespace-nowrap w-0">Issues</th>
                  <th class="text-right whitespace-nowrap w-0">IDEs</th>
                </tr>
              </thead>
              <tbody id="project-list" data-testid="projects-list">
                ${projects.length > 0
                  ? (await Promise.all(projects.map(async project => `
                    <tr class="project-row" data-ides='${JSON.stringify(project.ideNames)}'>
                      <td class="text-center">
                        ${hasMetrics ? `<input type=\"checkbox\" id=\"project-${encodeURIComponent(project.name)}\" class=\"project-checkbox checkbox checkbox-primary checkbox-sm\" data-project-name=\"${project.name}\" onchange=\"handleProjectSelection(this)\">` : ''}
                      </td>
                      <td class="w-full">
                        <a href="/project/${encodeURIComponent(project.name)}" class="project-name font-bold" data-testid="project-link-${project.name}">
                          ${project.name}
                        </a>
                      </td>
                      <td class="text-right whitespace-nowrap w-0" data-updated-ts="${project.lastUpdated ? project.lastUpdated.getTime() : 0}">
                        <span class="text-sm text-base-content/70">${project.lastUpdated ? project.lastUpdated.toLocaleString(locale) : '-'}</span>
                      </td>
                      <td class="text-right whitespace-nowrap w-0">
                        <span class="text-sm text-base-content/70">${(await project.issues).size}</span>
                      </td>
                      <td class="text-right whitespace-nowrap w-0">
                        <div class="flex gap-1 justify-end" data-testid="ide-icons">
                          ${project.ideNames.map(ide => `
                            <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-6 h-6" />
                          `).join('')}
                        </div>
                      </td>
                    </tr>
                  `))).join('')
                  : '<tr><td colspan="5" class="p-4 text-center text-base-content/70" data-testid="empty-projects-message">No JetBrains projects found</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating homepage:', error)
    res.status(500).send('An error occurred while generating the homepage')
  }
})

// API endpoint to get projects by name
router.get('/api/projects', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { names } = req.query
    const projectNames: string[] = names ? (names as string).split(',') : []
    const allProjects: Project[] = Array.from((await jetBrains.projects).values())

    // Filter projects by name if names are provided
    const projects: Project[] = projectNames.length > 0
      ? allProjects.filter(project => projectNames.includes(project.name))
      : allProjects

    res.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ error: 'An error occurred while fetching projects' })
  }
})

// API endpoint to get graph data for selected projects
router.get('/api/projects/graph', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains

  try {
    const { names } = req.query
    const projectNames: string[] = names ? (names as string).split(',') : []
    const allProjects: Project[] = Array.from((await jetBrains.projects).values())

    // Filter projects by name if names are provided
    const projects: Project[] = projectNames.length > 0
      ? allProjects.filter(project => projectNames.includes(project.name))
      : []

    // Prepare graph data
    const graphData: {
      datasets: Array<{
        label: string;
        data: Array<{ x: string; y: number }>;
        borderColor: string;
        backgroundColor: string;
        borderDash?: number[];
        fill: boolean;
        tension: number;
        yAxisID: string;
      }>;
      timeUnit: string;
      stepSize: number;
      projectNames: string[];
    } = await prepareProjectsGraphData(projects)

    res.json(graphData)
  } catch (error) {
    console.error('Error generating graph data:', error)
    res.status(500).json({ error: 'An error occurred while generating graph data' })
  }
})

export default router
