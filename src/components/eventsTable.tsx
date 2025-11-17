/** @jsxImportSource @kitajs/html */

import { EventRecord } from "../schema/eventRecord"
import { escapeHtml } from "../utils/escapeHtml"

interface EventsTableProps {
  events: EventRecord[]
}

export const EventsTable = ({ events }: EventsTableProps) => {
  if (events.length === 0) {
    return (
      <div class="p-4 text-center text-base-content/70" data-testid="no-events-message">
        No events found for this task
      </div>
    )
  }

  let cost = 0

  return (
    <div class="overflow-x-auto">
      <table class="table w-full bg-base-100" data-testid="events-table">
        <thead>
        <tr class="!bg-base-200 text-base-content">
          <th class="text-left whitespace-nowrap w-fit">Timestamp</th>
          <th class="text-left whitespace-nowrap w-fit">Event Type</th>
          <th class="text-left whitespace-nowrap max-w-2xl">JSON</th>
          <th class="text-right whitespace-nowrap w-fit">Cost</th>
        </tr>
        </thead>
        <tbody>
        {events.map((eventRecord, index) => {
          const pad = (n: number, len = 2) => n.toString().padStart(len, '0')
          const d = eventRecord.timestamp
          const timestampDisplay = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`

          if (eventRecord.event.type === 'LlmResponseEvent') {
            cost += eventRecord.event.answer.cost
          }

          return (
            <tr data-testid={`event-row-${index}`} class="text-base-content">
              <td class="text-left whitespace-nowrap w-fit">{timestampDisplay}</td>
              <td
                class={`text-left whitespace-nowrap w-fit ${eventRecord.parseError ? 'bg-red-100 text-red-800' : ''}`}>
                {escapeHtml(eventRecord.event.type)}
                {eventRecord.parseError ? '(parseError)' : ''}
              </td>
              <td class="text-left max-w-2xl">
                <div
                  class="max-h-48 overflow-auto bg-base-200 text-base-content p-2 rounded font-mono text-xs whitespace-pre break-all">
                  {escapeHtml(JSON.stringify(eventRecord.event, null, 2))}
                </div>
              </td>
              <td class="text-right whitespace-nowrap w-fit">
                {eventRecord.event.type === 'LlmResponseEvent' ? eventRecord.event.answer.cost.toFixed(4) : '-'}
              </td>
            </tr>
          )
        })}
        </tbody>
        <tfoot>
        <tr class="!bg-gray-50 font-bold border-t-2 border-gray-300">
          <td colspan="3" class="text-right">Total Cost</td>
          <td class="text-right whitespace-nowrap">{cost.toFixed(4)}</td>
        </tr>
        </tfoot>
      </table>
    </div>
  )
}