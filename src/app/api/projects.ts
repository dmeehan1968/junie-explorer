import express from "express"
import { SummaryMetrics } from "../../schema"
import { Project } from "../../Project"
import { AgentType } from "../../schema/agentType"
import { isResponseEvent } from "../../schema/llmResponseEvent"
import { AppRequest, AppResponse } from "../types"

const router = express.Router({ mergeParams: true })

// Function to prepare data for the projects graph
async function prepareProjectsGraphData(projects: Project[], requestedGroup?: string, breakdownByModel: boolean = false): Promise<{
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
  // Group issues by day and key (project or model), and also by hour for finer grouping when requested
  const issuesByDay: Record<string, Record<string, { cost: number; tokens: number }>> = {}
  const issuesByHour: Record<string, Record<string, { cost: number; tokens: number }>> = {}
  const seriesColors: Record<string, string> = {}
  const seriesLabels: Record<string, string> = {}

  // Helper to update buckets
  const updateBuckets = (key: string, day: string, hourKey: string, metrics: SummaryMetrics) => {
    // Init day bucket
    if (!issuesByDay[day]) {
      issuesByDay[day] = {}
    }
    if (!issuesByDay[day][key]) {
      issuesByDay[day][key] = { cost: 0, tokens: 0 }
    }
    // Init hour bucket
    if (!issuesByHour[hourKey]) {
      issuesByHour[hourKey] = {}
    }
    if (!issuesByHour[hourKey][key]) {
      issuesByHour[hourKey][key] = { cost: 0, tokens: 0 }
    }
    // Aggregate into day
    issuesByDay[day][key].cost += metrics.cost
    issuesByDay[day][key].tokens += metrics.inputTokens + metrics.outputTokens
    // Aggregate into hour
    issuesByHour[hourKey][key].cost += metrics.cost
    issuesByHour[hourKey][key].tokens += metrics.inputTokens + metrics.outputTokens
  }

  // Find min and max dates across all projects
  let minDate = new Date()
  let maxDate = new Date(0)

  // Process each project's issues
  await Promise.all(projects.map(async (project) => {
    // Generate base color for project
    const projectIndex = projects.indexOf(project)
    const hue = (projectIndex * 137) % 360
    const projectBaseColor = `hsl(${hue}, 70%, 60%)`

    const issues = await project.issues
    await Promise.all(Array.from(issues.values()).map(async (issue) => {
      const date = new Date(issue.created)
      const day = date.toISOString().split('T')[0] // YYYY-MM-DD format
      const hourKey = date.toISOString().slice(0, 13) + ':00' // YYYY-MM-DDTHH:00 in UTC

      if (date < minDate) minDate = date
      if (date > maxDate) maxDate = date

      if (breakdownByModel) {
        const metricsByModel = await issue.metricsByModel
        for (const [model, metrics] of Object.entries(metricsByModel)) {
          // Use model name as key
          const key = model
          if (!seriesLabels[key]) {
            seriesLabels[key] = model
            // Generate a consistent color for this Model
            let hash = 0
            for (let i = 0 ; i < key.length ; i++) {
              hash = key.charCodeAt(i) + ((hash << 5) - hash)
            }
            const keyHue = Math.abs(hash % 360)
            seriesColors[key] = `hsl(${keyHue}, 70%, 60%)`
          }
          updateBuckets(key, day, hourKey, metrics)
        }
      } else {
        const metrics = await issue.metrics
        const key = project.name
        if (!seriesLabels[key]) {
          seriesLabels[key] = project.name
          seriesColors[key] = projectBaseColor
        }
        updateBuckets(key, day, hourKey, metrics)
      }
    }))
  }))

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
    key: string,
    timeUnit: string,
    metricType: 'cost' | 'tokens',
  ): Array<{ x: string; y: number }> {
    const groupedData: Record<string, number> = {}

    if (timeUnit === 'hour') {
      Object.keys(byHour)
        .sort()
        .forEach(hourKey => {
          const value = byHour[hourKey][key]?.[metricType] || 0
          if (value > 0) {
            groupedData[hourKey] = (groupedData[hourKey] || 0) + value
          }
        })
    } else {
      Object.keys(byDay)
        .sort() // Sort days in chronological order
        .forEach(day => {
          const value = byDay[day][key]?.[metricType] || 0
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

  // Collect all unique series keys
  const allSeriesKeys = new Set<string>()
  Object.values(issuesByDay).forEach(dayData => Object.keys(dayData).forEach(k => allSeriesKeys.add(k)))
  Object.values(issuesByHour).forEach(hourData => Object.keys(hourData).forEach(k => allSeriesKeys.add(k)))
  
  const sortedSeriesKeys = Array.from(allSeriesKeys).sort((a, b) => {
    const labelA = seriesLabels[a] || a
    const labelB = seriesLabels[b] || b
    return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' })
  })

  // Create datasets for cost
  const costDatasets: Array<{
    label: string;
    data: Array<{ x: string; y: number }>;
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
    yAxisID: string;
  }> = sortedSeriesKeys.map(key => {
    const data = groupDataByTimeUnit(issuesByDay, issuesByHour, key, timeUnit, 'cost')

    return {
      label: seriesLabels[key],
      data: data,
      borderColor: seriesColors[key],
      backgroundColor: seriesColors[key],
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
  }> = sortedSeriesKeys.map(key => {
    const data = groupDataByTimeUnit(issuesByDay, issuesByHour, key, timeUnit, 'tokens')

    return {
      label: seriesLabels[key],
      data: data,
      borderColor: seriesColors[key],
      backgroundColor: seriesColors[key],
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

// Function to prepare data for the projects graph broken down by agent type
async function prepareAgentTypeGraphData(projects: Project[], requestedGroup?: string): Promise<{
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
  // Group data by day/hour and agent type
  const dataByDay: Record<string, Record<string, { cost: number; tokens: number }>> = {}
  const dataByHour: Record<string, Record<string, { cost: number; tokens: number }>> = {}
  const seriesColors: Record<string, string> = {}
  const seriesLabels: Record<string, string> = {}

  // Assign colors to agent types
  const agentTypeColors: Record<string, string> = {
    'Agent': 'hsl(210, 70%, 60%)',
    'TaskSummarizer': 'hsl(30, 70%, 60%)',
    'Memorizer': 'hsl(120, 70%, 60%)',
    'ErrorAnalyzer': 'hsl(0, 70%, 60%)',
    'LanguageIdentifier': 'hsl(270, 70%, 60%)',
    'MemoryCompactor': 'hsl(180, 70%, 60%)',
  }

  let minDate = new Date()
  let maxDate = new Date(0)

  // Process each project's issues and tasks to get metrics by agent type from events
  await Promise.all(projects.map(async (project) => {
    const issues = await project.issues
    await Promise.all(Array.from(issues.values()).map(async (issue) => {
      const tasks = await issue.tasks
      await Promise.all(Array.from(tasks.values()).map(async (task) => {
        try {
          const events = await task.events

          for (const eventRecord of events) {
            if (isResponseEvent(eventRecord.event)) {
              const responseEvent = eventRecord.event
              const requestEvent = responseEvent.requestEvent
              const agentType = requestEvent?.chat.agentType ?? 'Agent'

              const cost = responseEvent.answer.cost ?? 0
              const inputTokens = responseEvent.answer.inputTokens ?? 0
              const outputTokens = responseEvent.answer.outputTokens ?? 0
              const tokens = inputTokens + outputTokens

              const timestamp = eventRecord.timestamp
              const day = timestamp.toISOString().split('T')[0]
              const hourKey = timestamp.toISOString().slice(0, 13) + ':00'

              if (timestamp < minDate) minDate = timestamp
              if (timestamp > maxDate) maxDate = timestamp

              const key = agentType
              if (!seriesLabels[key]) {
                seriesLabels[key] = agentType
                seriesColors[key] = agentTypeColors[agentType] ?? 'hsl(0, 0%, 60%)'
              }

              // Aggregate by day
              if (!dataByDay[day]) dataByDay[day] = {}
              if (!dataByDay[day][key]) dataByDay[day][key] = { cost: 0, tokens: 0 }
              dataByDay[day][key].cost += cost
              dataByDay[day][key].tokens += tokens

              // Aggregate by hour
              if (!dataByHour[hourKey]) dataByHour[hourKey] = {}
              if (!dataByHour[hourKey][key]) dataByHour[hourKey][key] = { cost: 0, tokens: 0 }
              dataByHour[hourKey][key].cost += cost
              dataByHour[hourKey][key].tokens += tokens
            }
          }
        } catch (e) {
          // Skip tasks that fail to load events
        }
      }))
    }))
  }))

  // Determine time unit based on date range
  let timeUnit: string = 'day'
  let stepSize: number = 1

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

  // Override with requested group if provided
  const allowedGroups = new Set(['hour', 'day', 'week', 'month'])
  if (requestedGroup && allowedGroups.has(requestedGroup)) {
    timeUnit = requestedGroup
    stepSize = 1
  }

  // Helper to format date by time unit
  function formatDateByTimeUnit(dateStr: string, timeUnit: string): string {
    if (timeUnit === 'hour') return dateStr
    const date = new Date(dateStr)
    switch (timeUnit) {
      case 'day':
        return dateStr
      case 'week':
        const firstDayOfWeek = new Date(date)
        firstDayOfWeek.setDate(date.getDate() - date.getDay())
        return firstDayOfWeek.toISOString().split('T')[0]
      case 'month':
        return `${dateStr.substring(0, 7)}`
      case 'year':
        return `${dateStr.substring(0, 4)}`
      default:
        return dateStr
    }
  }

  // Group data by time unit
  function groupDataByTimeUnit(
    byDay: Record<string, Record<string, { cost: number; tokens: number }>>,
    byHour: Record<string, Record<string, { cost: number; tokens: number }>>,
    key: string,
    timeUnit: string,
    metricType: 'cost' | 'tokens'
  ): Array<{ x: string; y: number }> {
    const groupedData: Record<string, number> = {}

    if (timeUnit === 'hour') {
      Object.keys(byHour).sort().forEach(hourKey => {
        const value = byHour[hourKey][key]?.[metricType] || 0
        if (value > 0) {
          groupedData[hourKey] = (groupedData[hourKey] || 0) + value
        }
      })
    } else {
      Object.keys(byDay).sort().forEach(day => {
        const value = byDay[day][key]?.[metricType] || 0
        if (value > 0) {
          const timeUnitKey = formatDateByTimeUnit(day, timeUnit)
          groupedData[timeUnitKey] = (groupedData[timeUnitKey] || 0) + value
        }
      })
    }

    return Object.keys(groupedData).sort().map(key => ({
      x: key,
      y: groupedData[key],
    }))
  }

  // Collect all unique series keys
  const allSeriesKeys = new Set<string>()
  Object.values(dataByDay).forEach(dayData => Object.keys(dayData).forEach(k => allSeriesKeys.add(k)))
  Object.values(dataByHour).forEach(hourData => Object.keys(hourData).forEach(k => allSeriesKeys.add(k)))

  const sortedSeriesKeys = Array.from(allSeriesKeys).sort((a, b) => {
    const labelA = seriesLabels[a] || a
    const labelB = seriesLabels[b] || b
    return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' })
  })

  // Create datasets for cost
  const costDatasets = sortedSeriesKeys.map(key => {
    const data = groupDataByTimeUnit(dataByDay, dataByHour, key, timeUnit, 'cost')
    return {
      label: seriesLabels[key],
      data: data,
      borderColor: seriesColors[key],
      backgroundColor: seriesColors[key],
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
    }
  })

  // Create datasets for tokens
  const tokenDatasets = sortedSeriesKeys.map(key => {
    const data = groupDataByTimeUnit(dataByDay, dataByHour, key, timeUnit, 'tokens')
    return {
      label: seriesLabels[key],
      data: data,
      borderColor: seriesColors[key],
      backgroundColor: seriesColors[key],
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

// Function to prepare TPS (Tokens Per Second) data for the projects graph
async function prepareTpsGraphData(projects: Project[], requestedGroup?: string, breakdownByModel: boolean = false, breakdownByAgentType: boolean = false, agentType: AgentType = 'Agent'): Promise<{
  datasets: Array<{
    label: string;
    data: Array<{ x: string; y: number }>;
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
    yAxisID: string;
  }>;
  timeUnit: string;
  stepSize: number;
  projectNames: string[];
}> {
  // Collect TPS data points from LLM response events
  const tpsDataByDay: Record<string, Record<string, { totalTps: number; count: number }>> = {}
  const tpsDataByHour: Record<string, Record<string, { totalTps: number; count: number }>> = {}
  const seriesColors: Record<string, string> = {}
  const seriesLabels: Record<string, string> = {}

  // Assign colors to agent types
  const agentTypeColors: Record<string, string> = {
    'Agent': 'hsl(210, 70%, 60%)',
    'TaskSummarizer': 'hsl(30, 70%, 60%)',
    'Memorizer': 'hsl(120, 70%, 60%)',
    'ErrorAnalyzer': 'hsl(0, 70%, 60%)',
    'LanguageIdentifier': 'hsl(270, 70%, 60%)',
    'MemoryCompactor': 'hsl(180, 70%, 60%)',
  }

  let minDate = new Date()
  let maxDate = new Date(0)

  // Process each project's issues and tasks to get TPS data from events
  await Promise.all(projects.map(async (project, projectIndex) => {
    const hue = (projectIndex * 137) % 360
    const projectBaseColor = `hsl(${hue}, 70%, 60%)`

    const issues = await project.issues
    await Promise.all(Array.from(issues.values()).map(async (issue) => {
      const tasks = await issue.tasks
      await Promise.all(Array.from(tasks.values()).map(async (task) => {
        try {
          const events = await task.events

          for (const eventRecord of events) {
            if (isResponseEvent(eventRecord.event)) {
              const responseEvent = eventRecord.event
              const requestEvent = responseEvent.requestEvent
              const eventAgentType = requestEvent?.chat.agentType ?? 'Agent'

              // For non-agentType breakdown, filter by the selected agent type
              if (!breakdownByAgentType && eventAgentType !== agentType) {
                continue // Skip events that don't match the agent type filter
              }

              const outputTokens = responseEvent.answer.outputTokens ?? 0
              const time = responseEvent.answer.time ?? 0
              const tps = time > 0 ? (outputTokens / (time / 1000)) : 0

              if (tps <= 0) continue // Skip zero or negative TPS

              const timestamp = eventRecord.timestamp
              const day = timestamp.toISOString().split('T')[0]
              const hourKey = timestamp.toISOString().slice(0, 13) + ':00'

              if (timestamp < minDate) minDate = timestamp
              if (timestamp > maxDate) maxDate = timestamp

              let key: string
              if (breakdownByAgentType) {
                key = eventAgentType
                if (!seriesLabels[key]) {
                  seriesLabels[key] = eventAgentType
                  seriesColors[key] = agentTypeColors[eventAgentType] ?? 'hsl(0, 0%, 60%)'
                }
              } else if (breakdownByModel) {
                key = responseEvent.answer.llm.name
                if (!seriesLabels[key]) {
                  seriesLabels[key] = key
                  let hash = 0
                  for (let i = 0; i < key.length; i++) {
                    hash = key.charCodeAt(i) + ((hash << 5) - hash)
                  }
                  const keyHue = Math.abs(hash % 360)
                  seriesColors[key] = `hsl(${keyHue}, 70%, 60%)`
                }
              } else {
                key = project.name
                if (!seriesLabels[key]) {
                  seriesLabels[key] = project.name
                  seriesColors[key] = projectBaseColor
                }
              }

              // Aggregate TPS by day
              if (!tpsDataByDay[day]) tpsDataByDay[day] = {}
              if (!tpsDataByDay[day][key]) tpsDataByDay[day][key] = { totalTps: 0, count: 0 }
              tpsDataByDay[day][key].totalTps += tps
              tpsDataByDay[day][key].count += 1

              // Aggregate TPS by hour
              if (!tpsDataByHour[hourKey]) tpsDataByHour[hourKey] = {}
              if (!tpsDataByHour[hourKey][key]) tpsDataByHour[hourKey][key] = { totalTps: 0, count: 0 }
              tpsDataByHour[hourKey][key].totalTps += tps
              tpsDataByHour[hourKey][key].count += 1
            }
          }
        } catch (e) {
          // Skip tasks that fail to load events
        }
      }))
    }))
  }))

  // Determine time unit based on date range
  let timeUnit: string = 'day'
  let stepSize: number = 1

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

  // Override with requested group if provided
  const allowedGroups = new Set(['hour', 'day', 'week', 'month'])
  if (requestedGroup && allowedGroups.has(requestedGroup)) {
    timeUnit = requestedGroup
    stepSize = 1
  }

  // Helper to format date by time unit
  function formatDateByTimeUnit(dateStr: string, timeUnit: string): string {
    if (timeUnit === 'hour') return dateStr
    const date = new Date(dateStr)
    switch (timeUnit) {
      case 'day':
        return dateStr
      case 'week':
        const firstDayOfWeek = new Date(date)
        firstDayOfWeek.setDate(date.getDate() - date.getDay())
        return firstDayOfWeek.toISOString().split('T')[0]
      case 'month':
        return `${dateStr.substring(0, 7)}`
      case 'year':
        return `${dateStr.substring(0, 4)}`
      default:
        return dateStr
    }
  }

  // Group TPS data by time unit and calculate average TPS
  function groupTpsDataByTimeUnit(
    byDay: Record<string, Record<string, { totalTps: number; count: number }>>,
    byHour: Record<string, Record<string, { totalTps: number; count: number }>>,
    key: string,
    timeUnit: string
  ): Array<{ x: string; y: number }> {
    const groupedData: Record<string, { totalTps: number; count: number }> = {}

    if (timeUnit === 'hour') {
      Object.keys(byHour).sort().forEach(hourKey => {
        const value = byHour[hourKey][key]
        if (value && value.count > 0) {
          if (!groupedData[hourKey]) groupedData[hourKey] = { totalTps: 0, count: 0 }
          groupedData[hourKey].totalTps += value.totalTps
          groupedData[hourKey].count += value.count
        }
      })
    } else {
      Object.keys(byDay).sort().forEach(day => {
        const value = byDay[day][key]
        if (value && value.count > 0) {
          const timeUnitKey = formatDateByTimeUnit(day, timeUnit)
          if (!groupedData[timeUnitKey]) groupedData[timeUnitKey] = { totalTps: 0, count: 0 }
          groupedData[timeUnitKey].totalTps += value.totalTps
          groupedData[timeUnitKey].count += value.count
        }
      })
    }

    // Calculate average TPS for each time period
    return Object.keys(groupedData).sort().map(key => ({
      x: key,
      y: groupedData[key].count > 0 ? groupedData[key].totalTps / groupedData[key].count : 0,
    }))
  }

  // Collect all unique series keys
  const allSeriesKeys = new Set<string>()
  Object.values(tpsDataByDay).forEach(dayData => Object.keys(dayData).forEach(k => allSeriesKeys.add(k)))
  Object.values(tpsDataByHour).forEach(hourData => Object.keys(hourData).forEach(k => allSeriesKeys.add(k)))

  const sortedSeriesKeys = Array.from(allSeriesKeys).sort((a, b) => {
    const labelA = seriesLabels[a] || a
    const labelB = seriesLabels[b] || b
    return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' })
  })

  // Create TPS datasets
  const tpsDatasets = sortedSeriesKeys.map(key => {
    const data = groupTpsDataByTimeUnit(tpsDataByDay, tpsDataByHour, key, timeUnit)
    return {
      label: seriesLabels[key],
      data: data,
      borderColor: seriesColors[key],
      backgroundColor: seriesColors[key],
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
    }
  })

  return {
    datasets: tpsDatasets,
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
    const { names, group, breakdown, display, agentType } = req.query
    const projectNames: string[] = names ? (names as string).split(',') : []
    const requestedGroup: string | undefined = typeof group === 'string' ? group : undefined
    const breakdownByModel: boolean = breakdown === 'model'
    const breakdownByAgentType: boolean = breakdown === 'agentType'
    const displayOption: string = typeof display === 'string' ? display : 'cost'
    const agentTypeParam: AgentType = typeof agentType === 'string' && AgentType.safeParse(agentType).success
      ? agentType as AgentType
      : 'Agent'
    const allProjects: Project[] = Array.from((await req.jetBrains?.projects ?? []).values())

    // Filter projects by name if names are provided
    const projects: Project[] = projectNames.length > 0
      ? allProjects.filter(project => projectNames.includes(project.name))
      : []

    // Prepare graph data based on display option
    let graphData: {
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
    }

    if (displayOption === 'tps') {
      graphData = await prepareTpsGraphData(projects, requestedGroup, breakdownByModel, breakdownByAgentType, agentTypeParam)
    } else if (breakdownByAgentType) {
      graphData = await prepareAgentTypeGraphData(projects, requestedGroup)
    } else {
      graphData = await prepareProjectsGraphData(projects, requestedGroup, breakdownByModel)
    }

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

