// Function to prepare data for the LLM events metrics over time graph
import { makeGroupName } from "../app/api/trajectories/contextSize"
import { EventRecord } from "../schema/eventRecord"
import { LlmResponseEvent } from "../schema/llmResponseEvent"

export function prepareLlmEventGraphData(events: EventRecord[]): {
  labels: string[],
  datasets: any[],
  timeUnit: string,
  stepSize: number,
  providers: string[]
} {
  // Filter for LlmResponseEvent events only
  const llmEvents = events.filter((event): event is {
    event: LlmResponseEvent,
    timestamp: Date
  } => event.event.type === 'LlmResponseEvent')

  if (llmEvents.length === 0) {
    return {
      labels: [],
      datasets: [],
      timeUnit: 'minute',
      stepSize: 1,
      providers: [],
    }
  }

  // Extract unique providers
  const providers = [...new Set(llmEvents.map(event => makeGroupName(event.event)))].sort()

  // Use the actual timestamps from the event data
  const eventTimes = llmEvents.map(event => event.timestamp)

  // Find min and max dates
  const minDate = eventTimes.length > 0 ? new Date(Math.min(...eventTimes.map(date => date.getTime()))) : new Date()
  const maxDate = eventTimes.length > 0 ? new Date(Math.max(...eventTimes.map(date => date.getTime()))) : new Date()

  // Calculate the date range in milliseconds
  const dateRange = maxDate.getTime() - minDate.getTime()

  // Determine the appropriate time unit based on the date range
  let timeUnit = 'minute' // default for events (usually short timeframe)
  let stepSize = 1

  // Constants for time calculations
  const MINUTE = 60 * 1000
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const WEEK = 7 * DAY
  const MONTH = 30 * DAY
  const YEAR = 365 * DAY

  // Minimum number of labels we want to display
  const MIN_LABELS = 5

  if (dateRange < MINUTE * 5) {
    timeUnit = 'second'
    stepSize = Math.max(1, Math.floor(dateRange / (1000 * MIN_LABELS)))
  } else if (dateRange < HOUR) {
    timeUnit = 'minute'
    stepSize = Math.max(1, Math.floor(dateRange / (MINUTE * MIN_LABELS)))
  } else if (dateRange < DAY) {
    timeUnit = 'hour'
    stepSize = Math.max(1, Math.floor(dateRange / (HOUR * MIN_LABELS)))
  } else if (dateRange < WEEK) {
    timeUnit = 'day'
    stepSize = Math.max(1, Math.floor(dateRange / (DAY * MIN_LABELS)))
  } else if (dateRange < MONTH) {
    timeUnit = 'week'
    stepSize = Math.max(1, Math.floor(dateRange / (WEEK * MIN_LABELS)))
  } else if (dateRange < YEAR) {
    timeUnit = 'month'
    stepSize = Math.max(1, Math.floor(dateRange / (MONTH * MIN_LABELS)))
  } else {
    timeUnit = 'year'
    stepSize = Math.max(1, Math.floor(dateRange / (YEAR * MIN_LABELS)))
  }

  // Create datasets for cost and token breakdowns
  const costData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.cost,
  }))

  const inputTokenData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.inputTokens ?? 0,
  }))

  const outputTokenData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.outputTokens ?? 0,
  }))

  const cacheTokenData = llmEvents.map(event => {
    const ans = event.event.answer
    return { x: event.timestamp.toISOString(), y: ans.cacheInputTokens ?? 0 }
  })

  const cacheCreateTokenData = llmEvents.map(event => {
    const ans = event.event.answer
    return { x: event.timestamp.toISOString(), y: ans.cacheCreateInputTokens ?? 0 }
  })

  const combinedTokenData = llmEvents.map(event => {
    const ans = event.event.answer
    const total = (ans.inputTokens ?? 0) + (ans.outputTokens ?? 0) + (ans.cacheCreateInputTokens ?? 0)
    return { x: event.timestamp.toISOString(), y: total }
  })

  let cumulativeCost = 0
  const cumulativeCostData = llmEvents.map(event => {
    cumulativeCost += event.event.answer.cost
    return { x: event.timestamp.toISOString(), y: cumulativeCost }
  })

  const datasets = [
    {
      label: 'Cost',
      data: costData,
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
    },
    {
      label: 'Cumulative Cost',
      data: cumulativeCostData,
      borderColor: 'rgb(255, 159, 64)',
      backgroundColor: 'rgba(255, 159, 64, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
      hidden: true,
    },
    {
      label: 'Input Tokens',
      data: inputTokenData,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      hidden: true,
    },
    {
      label: 'Output Tokens',
      data: outputTokenData,
      borderColor: 'rgb(255, 205, 86)',
      backgroundColor: 'rgba(255, 205, 86, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      hidden: true,
    },
    {
      label: 'Cache Tokens',
      data: cacheTokenData,
      borderColor: 'rgb(153, 102, 255)',
      backgroundColor: 'rgba(153, 102, 255, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      hidden: true,
    },
    {
      label: 'Cache Create Tokens',
      data: cacheCreateTokenData,
      borderColor: 'rgb(186, 85, 211)',
      backgroundColor: 'rgba(186, 85, 211, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      hidden: true,
    },
    {
      label: 'Tokens (Combined)',
      data: combinedTokenData,
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
    },
  ]

  return {
    labels: llmEvents.map(event => event.timestamp.toISOString()),
    datasets,
    timeUnit,
    stepSize,
    providers,
  }
}