import { Html } from "@kitajs/html"

export const MemorySection = () => {
  return (
    <div class="grid grid-cols-3 gap-6 mb-6">
      {/* Memory Usage Chart - 2/3 width */}
      <div class="col-span-2 card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Memory Usage</h2>
          <div class="h-80">
            <canvas id="memoryChart"></canvas>
          </div>
        </div>
      </div>

      {/* Memory Metrics - 1/3 width */}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="text-lg font-semibold mb-3 text-primary">Memory Metrics</h3>
          <div class="grid grid-cols-1 gap-3">
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">RSS Memory (MB)</div>
              <div class="stat-value text-sm text-primary" id="memUsed">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Total Memory (MB)</div>
              <div class="stat-value text-sm text-primary" id="memTotal">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Heap Used (MB)</div>
              <div class="stat-value text-sm text-secondary" id="heapUsed">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Heap Total (MB)</div>
              <div class="stat-value text-sm text-secondary" id="heapTotal">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">External (MB)</div>
              <div class="stat-value text-sm text-accent" id="external">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Heap Usage %</div>
              <div class="stat-value text-sm text-accent" id="heapUsagePercent">-</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}