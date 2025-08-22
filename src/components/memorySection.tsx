import { Html } from "@kitajs/html"

export const MemorySection = () => {
  return (
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title mb-4">Memory Usage & Metrics</h2>
        <div class="grid grid-cols-3 gap-6">
          {/* Memory Usage Chart - 2/3 width */}
          <div class="col-span-2">
            <div class="h-80">
              <canvas id="memoryChart"></canvas>
            </div>
          </div>

          {/* Memory Metrics - 1/3 width */}
          <div class="flex flex-col justify-center h-80">
            <div class="grid grid-cols-2 gap-2">
              <div class="stat bg-base-200 rounded-lg p-2">
                <div class="stat-title text-xs">RSS Memory</div>
                <div class="stat-value text-sm text-primary" id="memUsed">-</div>
              </div>
              <div class="stat bg-base-200 rounded-lg p-2">
                <div class="stat-title text-xs">Total Memory</div>
                <div class="stat-value text-sm text-primary" id="memTotal">-</div>
              </div>
              <div class="stat bg-base-200 rounded-lg p-2">
                <div class="stat-title text-xs">Heap Used</div>
                <div class="stat-value text-sm text-secondary" id="heapUsed">-</div>
              </div>
              <div class="stat bg-base-200 rounded-lg p-2">
                <div class="stat-title text-xs">Heap Total</div>
                <div class="stat-value text-sm text-secondary" id="heapTotal">-</div>
              </div>
              <div class="stat bg-base-200 rounded-lg p-2">
                <div class="stat-title text-xs">External</div>
                <div class="stat-value text-sm text-accent" id="external">-</div>
              </div>
              <div class="stat bg-base-200 rounded-lg p-2">
                <div class="stat-title text-xs">Heap Usage %</div>
                <div class="stat-value text-sm text-accent" id="heapUsagePercent">-</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}