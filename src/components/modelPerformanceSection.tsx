/** @jsxImportSource @kitajs/html */
import { Html } from "@kitajs/html"
import { Conditional } from "./conditional.js"

export const ModelPerformanceSection = ({ hasMetrics }: { hasMetrics: boolean }) => {
  return (
    <div class="collapsible-section collapsed mb-5 bg-base-200 rounded-lg border border-base-300 collapsed"
         data-testid="model-performance-section" data-has-metrics={String(hasMetrics)}>
      <div
        class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-200 rounded-lg hover:bg-base-100 transition-colors duration-200"
        data-testid="model-performance-header">
        <h3 class="text-xl font-bold text-primary m-0">Model Performance</h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
      </div>
      <div class="collapsible-content p-4 hidden transition-all duration-300">
        <div class="mb-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3 flex-wrap justify-between">
              <div id="model-performance-provider-filters" class="join flex flex-wrap">
                {/* Provider buttons will be populated by JavaScript */}
              </div>
              <div class="flex items-center gap-3 ml-auto">
                <div id="model-performance-metric-toggle" class="join">
                  {hasMetrics ? (
                    <>
                      <button class="btn btn-sm join-item btn-primary" data-metric="both" aria-pressed="true">Both</button>
                      <button class="btn btn-sm join-item" data-metric="latency" aria-pressed="false">Latency</button>
                      <button class="btn btn-sm join-item" data-metric="tps" aria-pressed="false">Tokens/sec</button>
                    </>
                  ) : <></>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="w-full">
          <canvas id="model-performance-chart"
                  class="w-full max-w-full h-96 border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
        </div>
      </div>
    </div>
  )
}