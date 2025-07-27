import express from 'express'
import { JetBrains } from "../jetbrains.js"
import { Project } from '../Project.js'
import { jetBrainsPath } from '../utils/jetBrainsPath.js'
import { VersionBanner } from '../utils/versionBanner.js'

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

// Homepage route (now shows projects instead of IDEs)
router.get('/', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
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
      <html lang="en" data-theme="light">
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
        <script src="/js/ideFilters.js"></script>
        <script src="/js/projectSelection.js"></script>
        <script src="/js/reloadPage.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-7xl mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer</h1>
            <button id="reload-button" class="btn btn-primary" data-testid="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          ${VersionBanner(jetBrains.version)}
          <p class="mb-5 text-base-content/70" data-testid="logs-directory-path">Projects found in: ${jetBrainsPath}</p>

          <div class="flex flex-wrap gap-3 mb-5 p-3 bg-base-200 rounded" data-testid="ide-filter-toolbar">
            <div class="font-medium text-base-content">Filter by IDE</div>
            ${uniqueIdes.map(ide => `
              <div class="ide-filter cursor-pointer transition-all duration-300 p-1 rounded hover:bg-base-300" data-testid="ide-filter" data-ide="${ide}" onclick="toggleIdeFilter(this)">
                <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
              </div>
            `).join('')}
            <div class="ml-auto">
              <input type="text" id="project-search-input" data-testid="project-search" placeholder="Search projects..." oninput="filterByProjectName(this.value)" class="input input-bordered input-sm w-64">
            </div>
          </div>

          <div id="projects-graph-container" class="h-96 mb-5 p-4 bg-base-100 rounded-lg border border-base-300 hidden">
            <canvas id="projectsMetricsChart"></canvas>
          </div>

          <div class="flex justify-between items-center mb-5 p-4 bg-base-200 rounded-lg">
            <div class="flex items-center gap-2">
              <input type="checkbox" id="select-all-projects" onchange="toggleSelectAllProjects()" class="checkbox checkbox-primary">
              <label for="select-all-projects" class="font-medium cursor-pointer">Select All</label>
            </div>
            <div class="flex gap-4">
              <div class="flex items-center gap-2">
                <input type="radio" id="display-both" name="display-option" value="both" checked onchange="handleDisplayOptionChange(this)" class="radio radio-primary">
                <label for="display-both" class="cursor-pointer">Both</label>
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" id="display-cost" name="display-option" value="cost" onchange="handleDisplayOptionChange(this)" class="radio radio-primary">
                <label for="display-cost" class="cursor-pointer">Cost</label>
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" id="display-tokens" name="display-option" value="tokens" onchange="handleDisplayOptionChange(this)" class="radio radio-primary">
                <label for="display-tokens" class="cursor-pointer">Tokens</label>
              </div>
            </div>
          </div>

          <ul class="space-y-3" data-testid="projects-list">
            ${projects.length > 0
              ? (await Promise.all(projects.map(async project => `
                  <li class="project-item flex items-center p-4 bg-base-200 border-l-4 border-primary rounded transition-all duration-300 hover:bg-base-300 hover:translate-x-1" data-testid="project-item" data-ides='${JSON.stringify(project.ideNames)}'>
                    <div class="mr-4">
                      <input type="checkbox" id="project-${encodeURIComponent(project.name)}" 
                             class="project-checkbox checkbox checkbox-primary" 
                             data-project-name="${project.name}" 
                             onchange="handleProjectSelection(this)">
                    </div>
                    <a href="/project/${encodeURIComponent(project.name)}" class="flex-1 flex items-center justify-between text-decoration-none hover:text-primary transition-colors" data-testid="project-link-${project.name}">
                      <div class="flex-1">
                        <div class="project-name font-bold text-lg text-primary mb-1" data-testid="project-name">${project.name}</div>
                        <div class="text-sm text-base-content/70">${(await project.issues).size} issues</div>
                      </div>
                      <div class="flex gap-1 ml-4" data-testid="ide-icons">
                        ${project.ideNames.map(ide => `
                          <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-6 h-6" />
                        `).join('')}
                      </div>
                    </a>
                  </li>
                `))).join('')
              : '<li class="p-4 text-center text-base-content/70" data-testid="empty-projects-message">No JetBrains projects found</li>'
    }
          </ul>
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
