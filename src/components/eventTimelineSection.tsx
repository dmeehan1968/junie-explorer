import { EventRecord } from "../schema/eventRecord.js"

export const EventTimelineSection = ({ events }: { events: EventRecord[] }) => {
  if (events.length === 0) return null

  return (
    <div class="collapsible-section collapsed mb-5 bg-base-100 rounded-lg border border-base-300 collapsed"
         data-testid="event-timeline-section">
      <div
        class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-100 rounded-lg hover:bg-base-200 transition-colors duration-200"
        data-testid="event-timeline-header">
        <h3 class="text-xl font-bold text-primary m-0">Event Timeline</h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
      </div>
      <div class="collapsible-content px-4 pb-4 hidden transition-all duration-300">
        <div class="w-full">
          <canvas id="event-timeline-chart"
                  class="w-full max-w-full border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
        </div>
      </div>
    </div>
  )
}