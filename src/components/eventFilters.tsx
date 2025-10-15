import { escapeHtml } from "../utils/escapeHtml.js"

export const EventFilters = ({ eventTypes }: { eventTypes: string[] }) => {
  if (eventTypes.length === 0) return null

  return (
    <div class="mb-5">
      <div class="flex flex-wrap gap-2 mb-5 p-4 bg-base-200 rounded items-center">
        <div class="font-bold mr-2 flex items-center">Filter by Event Type:</div>
        <div
          class="cursor-pointer transition-all duration-300 rounded flex items-center gap-1 event-filter all-none-toggle"
          data-testid="all-none-toggle">
          <label
            class="cursor-pointer text-sm font-bold py-1 px-2 rounded transition-all duration-300 bg-primary border border-primary-300 text-primary-content">All/None</label>
        </div>
        {eventTypes.map(eventType => (
          <div class="cursor-pointer transition-all duration-300 rounded flex items-center gap-1 event-filter"
               data-event-type={escapeHtml(eventType)} data-testid={`event-filter-${escapeHtml(eventType)}`}>
            <label
              class="cursor-pointer text-sm py-1 px-2 rounded transition-all duration-300 bg-secondary border border-secondary-300 text-secondary-content">{escapeHtml(eventType)}</label>
          </div>
        ))}
      </div>
    </div>
  )
}