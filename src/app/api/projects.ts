import express from "express"
import { Project } from "../../Project.js"
import { AppRequest, AppResponse } from "../types.js"

const router = express.Router({ mergeParams: true })

// Function to prepare data for the projects graph
async function prepareProjectsGraphData(projects: Project[], requestedGroup?: string): Promise<{
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
  // Group issues by day and project, and also by hour for finer grouping when requested
  const issuesByDay: Record<string, Record<string, { cost: number; tokens: number }>> = {}
  const issuesByHour: Record<string, Record<string, { cost: number; tokens: number }>> = {}
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
      const hourKey = date.toISOString().slice(0, 13) + ':00' // YYYY-MM-DDTHH:00 in UTC

      if (date < minDate) minDate = date
      if (date > maxDate) maxDate = date

      // Init day bucket
      if (!issuesByDay[day]) {
        issuesByDay[day] = {}
      }
      if (!issuesByDay[day][project.name]) {
        issuesByDay[day][project.name] = { cost: 0, tokens: 0 }
      }

      // Init hour bucket
      if (!issuesByHour[hourKey]) {
        issuesByHour[hourKey] = {}
      }
      if (!issuesByHour[hourKey][project.name]) {
        issuesByHour[hourKey][project.name] = { cost: 0, tokens: 0 }
      }

      const metrics = await issue.metrics
      // Aggregate into day
      issuesByDay[day][project.name].cost += metrics.cost
      issuesByDay[day][project.name].tokens += metrics.inputTokens + metrics.outputTokens
      // Aggregate into hour
      issuesByHour[hourKey][project.name].cost += metrics.cost
      issuesByHour[hourKey][project.name].tokens += metrics.inputTokens + metrics.outputTokens
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

  // Override with requested group if provided (and not 'auto')
  const allowedGroups = new Set(['hour', 'day', 'week', 'month'])
  if (requestedGroup && allowedGroups.has(requestedGroup)) {
    timeUnit = requestedGroup
    stepSize = 1
  }

  // Helper function to convert a date string to the appropriate timeUnit format
  // dateStr is expected to be:
  //  - for 'hour': an ISO string like YYYY-MM-DDTHH:00 (already bucketed)
  //  - for 'day': YYYY-MM-DD
  //  - for 'week': any day string; it will be converted to the first day (Sunday) of that week
  //  - for 'month': YYYY-MM-DD -> YYYY-MM
  //  - for 'year': YYYY-MM-DD -> YYYY
  function formatDateByTimeUnit(dateStr: string, timeUnit: string): string {
    if (timeUnit === 'hour') {
      // Assume incoming key is already hour-bucketed; return as-is
      return dateStr
    }

    const date = new Date(dateStr)

    switch (timeUnit) {
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
    byDay: Record<string, Record<string, { cost: number; tokens: number }>>,
    byHour: Record<string, Record<string, { cost: number; tokens: number }>>,
    projectName: string,
    timeUnit: string,
    metricType: 'cost' | 'tokens',
  ): Array<{ x: string; y: number }> {
    const groupedData: Record<string, number> = {}

    if (timeUnit === 'hour') {
      Object.keys(byHour)
        .sort()
        .forEach(hourKey => {
          const value = byHour[hourKey][projectName]?.[metricType] || 0
          if (value > 0) {
            groupedData[hourKey] = (groupedData[hourKey] || 0) + value
          }
        })
    } else {
      Object.keys(byDay)
        .sort() // Sort days in chronological order
        .forEach(day => {
          const value = byDay[day][projectName]?.[metricType] || 0
          if (value > 0) {
            const timeUnitKey = formatDateByTimeUnit(day, timeUnit)
            groupedData[timeUnitKey] = (groupedData[timeUnitKey] || 0) + value
          }
        })
    }

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
    const data = groupDataByTimeUnit(issuesByDay, issuesByHour, project.name, timeUnit, 'cost')

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
    const data = groupDataByTimeUnit(issuesByDay, issuesByHour, project.name, timeUnit, 'tokens')

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

// API endpoint to get projects by name
router.get('/api/projects', async (req: AppRequest, res: AppResponse) => {
  try {
    const { names } = req.query
    const projectNames: string[] = names ? (names as string).split(',') : []
    const allProjects: Project[] = Array.from((await req.jetBrains?.projects ?? []).values())

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
router.get('/api/projects/graph', async (req: AppRequest, res: AppResponse) => {
  try {
    const { names, group } = req.query
    const projectNames: string[] = names ? (names as string).split(',') : []
    const requestedGroup: string | undefined = typeof group === 'string' ? group : undefined
    const allProjects: Project[] = Array.from((await req.jetBrains?.projects ?? []).values())

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
    } = await prepareProjectsGraphData(projects, requestedGroup)

    res.json(graphData)
  } catch (error) {
    console.error('Error generating graph data:', error)
    res.status(500).json({ error: 'An error occurred while generating graph data' })
  }
})

// API endpoint to get issue cost graph data for a single project
router.get('/api/projects/:projectId/issue-cost', async (req: AppRequest, res: AppResponse) => {
  try {
    const { projectId } = req.params as { projectId: string }
    const allProjects: Project[] = Array.from((await req.jetBrains?.projects ?? []).values())
    const project = allProjects.find(p => p.name === projectId)

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const issues = [...(await project.issues ?? []).values()]

    // Prepare graph data (similar to previous server-side implementation)
    // Sort by creation
    const sortedIssues = [...issues].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())

    // Find min and max dates
    const minDate = sortedIssues.length > 0 ? new Date(sortedIssues[0].created) : new Date()
    const maxDate = sortedIssues.length > 0 ? new Date(sortedIssues[sortedIssues.length - 1].created) : new Date()

    // Determine time unit
    const HOUR = 60 * 60 * 1000
    const DAY = 24 * HOUR
    const WEEK = 7 * DAY
    const MONTH = 30 * DAY
    const YEAR = 365 * DAY

    const dateRange = maxDate.getTime() - minDate.getTime()

    let timeUnit: string
    let stepSize = 1

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
      const hue = (index * 137) % 360
      const color = `hsl(${hue}, 70%, 60%)`
      const metrics = await issue.metrics
      return {
        label: issue.name,
        data: [{ x: issue.created, y: metrics.cost }],
        borderColor: color,
        backgroundColor: color,
        fill: false,
        tension: 0.1,
      }
    }))

    const graphData = {
      labels: [minDate.toISOString(), maxDate.toISOString()],
      datasets,
      timeUnit,
      stepSize,
    }

    res.json(graphData)
  } catch (error) {
    console.error('Error generating issue cost graph data:', error)
    res.status(500).json({ error: 'An error occurred while generating issue cost graph data' })
  }
})

export default router

