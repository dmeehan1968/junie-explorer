// JSX Components for trajectory sections
import { Html } from "@kitajs/html"

export const ActionTimelineSection = ({ hasActionEvents, actionCount }: {
  hasActionEvents: boolean,
  actionCount: number
}) => {
  if (!hasActionEvents) return null

  return (
    <div class="collapsible-section collapsed mb-5 bg-base-200 rounded-lg border border-base-300 collapsed"
         data-testid="action-timeline-section">
      <div
        class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-200 rounded-lg hover:bg-base-100 transition-colors duration-200"
        data-testid="action-timeline-header">
        <h3 class="text-xl font-bold text-primary m-0">Action Timeline <span
          class="font-medium text-base-content/70">({actionCount})</span></h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
      </div>
      <div class="collapsible-content p-4 hidden transition-all duration-300">
        <div class="w-full">
          <canvas id="action-timeline-chart"
                  class="w-full max-w-full border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
        </div>
      </div>
    </div>
  )
}