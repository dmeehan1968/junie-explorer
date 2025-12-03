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

  // Create datasets for cost breakdown
  const inputTokenCostData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.inputTokenCost ?? 0,
  }))

  const outputTokenCostData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.outputTokenCost ?? 0,
  }))

  const cacheInputTokenCostData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.cacheInputTokenCost ?? 0,
  }))

  const cacheCreateInputTokenCostData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.cacheCreateInputTokenCost ?? 0,
  }))

  const webSearchCostData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.webSearchCost ?? 0,
  }))

  // Create datasets for token counts
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

  const webSearchCountData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.webSearchCount ?? 0,
  }))

  // Cumulative cost data (sum of all individual cost types)
  let cumulativeCostSum = 0
  const cumulativeCostBreakdownData = llmEvents.map(event => {
    const ans = event.event.answer
    const eventCost = (ans.inputTokenCost ?? 0) + (ans.outputTokenCost ?? 0) +
      (ans.cacheInputTokenCost ?? 0) + (ans.cacheCreateInputTokenCost ?? 0) + (ans.webSearchCost ?? 0)
    cumulativeCostSum += eventCost
    return { x: event.timestamp.toISOString(), y: cumulativeCostSum }
  })

  // Cumulative tokens data (sum of token types, excluding cacheInputTokens)
  let cumulativeTokensSum = 0
  const cumulativeTokensData = llmEvents.map(event => {
    const ans = event.event.answer
    const eventTokens = (ans.inputTokens ?? 0) + (ans.outputTokens ?? 0) +
      (ans.cacheCreateInputTokens ?? 0) + (ans.webSearchCount ?? 0)
    cumulativeTokensSum += eventTokens
    return { x: event.timestamp.toISOString(), y: cumulativeTokensSum }
  })

  // Legacy datasets (kept for backward compatibility)
  const costData = llmEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.cost,
  }))

  let cumulativeCost = 0
  const cumulativeCostData = llmEvents.map(event => {
    cumulativeCost += event.event.answer.cost
    return { x: event.timestamp.toISOString(), y: cumulativeCost }
  })

  const combinedTokenData = llmEvents.map(event => {
    const ans = event.event.answer
    const total = (ans.inputTokens ?? 0) + (ans.outputTokens ?? 0) + (ans.cacheCreateInputTokens ?? 0)
    return { x: event.timestamp.toISOString(), y: total }
  })

  const datasets = [
    // Cost breakdown datasets (visible by default)
    {
      label: 'Input Token Cost',
      data: inputTokenCostData,
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
      group: 'cost',
    },
    {
      label: 'Output Token Cost',
      data: outputTokenCostData,
      borderColor: 'rgb(255, 159, 64)',
      backgroundColor: 'rgba(255, 159, 64, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
      group: 'cost',
    },
    {
      label: 'Cache Input Token Cost',
      data: cacheInputTokenCostData,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
      group: 'cost',
    },
    {
      label: 'Cache Create Input Token Cost',
      data: cacheCreateInputTokenCostData,
      borderColor: 'rgb(153, 102, 255)',
      backgroundColor: 'rgba(153, 102, 255, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
      group: 'cost',
    },
    {
      label: 'Web Search Cost',
      data: webSearchCostData,
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
      group: 'cost',
    },
    {
      label: 'Cumulative Cost',
      data: cumulativeCostBreakdownData,
      borderColor: 'rgb(50, 50, 50)',
      backgroundColor: 'rgba(50, 50, 50, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
      group: 'cost',
      borderDash: [5, 5],
    },
    // Token count datasets (hidden by default)
    {
      label: 'Input Tokens',
      data: inputTokenData,
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      group: 'tokens',
      hidden: true,
    },
    {
      label: 'Output Tokens',
      data: outputTokenData,
      borderColor: 'rgb(255, 159, 64)',
      backgroundColor: 'rgba(255, 159, 64, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      group: 'tokens',
      hidden: true,
    },
    {
      label: 'Cache Tokens',
      data: cacheTokenData,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      group: 'tokens',
      hidden: true,
    },
    {
      label: 'Cache Create Tokens',
      data: cacheCreateTokenData,
      borderColor: 'rgb(153, 102, 255)',
      backgroundColor: 'rgba(153, 102, 255, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      group: 'tokens',
      hidden: true,
    },
    {
      label: 'Web Search Count',
      data: webSearchCountData,
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      group: 'tokens',
      hidden: true,
    },
    {
      label: 'Cumulative Tokens',
      data: cumulativeTokensData,
      borderColor: 'rgb(50, 50, 50)',
      backgroundColor: 'rgba(50, 50, 50, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      group: 'tokens',
      hidden: true,
      borderDash: [5, 5],
    },
    // Legacy datasets (kept for backward compatibility, hidden by default)
    {
      label: 'Cost',
      data: costData,
      borderColor: 'rgb(100, 100, 100)',
      backgroundColor: 'rgba(100, 100, 100, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
      group: 'legacy',
      hidden: true,
    },
    {
      label: 'Cumulative Cost',
      data: cumulativeCostData,
      borderColor: 'rgb(150, 150, 150)',
      backgroundColor: 'rgba(150, 150, 150, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
      group: 'legacy',
      hidden: true,
    },
    {
      label: 'Tokens (Combined)',
      data: combinedTokenData,
      borderColor: 'rgb(200, 200, 200)',
      backgroundColor: 'rgba(200, 200, 200, 0.5)',
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
      group: 'legacy',
      hidden: true,
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