/** @jsxImportSource @kitajs/html */
export const EventMetricsSection = ({ hasMetrics }: { hasMetrics: boolean }) => {
  if (!hasMetrics) return null

  return (
    <div class="collapsible-section mb-5 bg-base-100 rounded-lg border border-base-300"
         data-testid="event-metrics-section">
      <div
        class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-100 rounded-t-lg hover:bg-base-200 transition-colors duration-200"
        data-testid="event-metrics-header">
        <h3 class="text-xl font-bold text-primary m-0">Event Metrics</h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to collapse</span>
      </div>
      <div class="collapsible-content px-4 pb-4 block transition-all duration-300">
        <div class="mb-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3 flex-wrap justify-between">
              <div id="metric-type-toggle" class="join" data-testid="metric-type-toggle">
                <button type="button" class="btn btn-sm join-item btn-primary" aria-pressed="true" data-value="cost">Cost</button>
                <button type="button" class="btn btn-sm join-item" aria-pressed="false" data-value="tokens">Tokens</button>
              </div>
              <div id="llm-provider-filters" class="join flex flex-wrap" data-testid="llm-provider-filters">
                {/* Provider buttons will be populated by JavaScript */}
              </div>
            </div>
          </div>
        </div>
        <div class="w-full h-96">
          <canvas id="llmMetricsChart"></canvas>
        </div>
      </div>
    </div>
  )
}