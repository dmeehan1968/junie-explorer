/** @jsxImportSource @kitajs/html */

import { Component } from "@kitajs/html"
import { escapeHtml } from "../utils/escapeHtml"

export interface EventStatisticsSectionProps {
  events: any[]
  task: { eventTypes: Promise<string[]> } | { eventTypes: string[] }
}

export const EventStatisticsSection: Component<EventStatisticsSectionProps> = async ({ events, task }) => {
  if (events.length === 0) return <></>

  // Calculate durations for each event
  const eventDurations = events.map((eventRecord, index) => {
    let duration = 0
    if (index > 0) {
      const prevRecord = events[index - 1]
      duration = eventRecord.timestamp.getTime() - prevRecord.timestamp.getTime()
    }
    return {
      type: eventRecord.event.type,
      duration: duration,
    }
  })

  // Group by event type and calculate statistics
  const eventTypeStats = new Map<string, number[]>((await task.eventTypes).map((eventType: string) => [eventType, []]))
  eventDurations.forEach(({ type, duration }) => {
    if (!eventTypeStats.has(type)) {
      eventTypeStats.set(type, [])
    }
    eventTypeStats.get(type)!.push(duration)
  })

  return (
    <div class="collapsible-section collapsed mb-5 bg-base-100 rounded-lg border border-base-300 collapsed"
         data-testid="event-statistics-section">
      <div
        class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-100 rounded-lg hover:bg-base-200 transition-colors duration-200"
        data-testid="event-statistics-header">
        <h3 class="text-xl font-bold text-primary m-0">Event Type Statistics</h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
      </div>
      <div class="collapsible-content px-4 pb-4 hidden transition-all duration-300">
        <div class="overflow-x-auto">
          <table class="table table-zebra table-sm w-full bg-base-100 text-base-content text-sm"
                 data-testid="event-stats-table">
            <thead>
            <tr class="!bg-base-200">
              <th class="text-left w-2/5 whitespace-nowrap">Event Type</th>
              <th class="text-right whitespace-nowrap">Sample Count</th>
              <th class="text-right whitespace-nowrap">Min Duration (ms)</th>
              <th class="text-right whitespace-nowrap">Max Duration (ms)</th>
              <th class="text-right whitespace-nowrap">Avg Duration (ms)</th>
            </tr>
            </thead>
            <tbody>
            {Array.from(eventTypeStats.entries()).map(([eventType, durations]) => {
              const min = Math.min(...durations)
              const max = Math.max(...durations)
              const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length

              return (
                <tr data-testid={`event-stats-row-${escapeHtml(eventType)}`}>
                  <td class="text-left whitespace-normal break-words w-2/5">{escapeHtml(eventType)}</td>
                  <td class="text-right whitespace-nowrap">{durations.length}</td>
                  <td class="text-right whitespace-nowrap">{min}</td>
                  <td class="text-right whitespace-nowrap">{max}</td>
                  <td class="text-right whitespace-nowrap">{Math.round(avg)}</td>
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
