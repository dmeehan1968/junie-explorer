import { Html } from "@kitajs/html"

export const WorkersSection = () => {
  return (
    <div class="grid grid-cols-3 gap-6 mb-6">
      {/* Worker Pool Chart - 2/3 width */}
      <div class="col-span-2 card bg-base-100 shadow-xl h-fit">
        <div class="card-body">
          <h2 class="card-title">Worker Pool Activity</h2>
          <div class="h-80">
            <canvas id="workerChart"></canvas>
          </div>
        </div>
      </div>

      {/* Worker Pool Metrics - 1/3 width */}
      <div class="card bg-base-100 shadow-xl h-fit">
        <div class="card-body">
          <h3 class="text-lg font-semibold mb-3 text-info">Worker Pool Metrics</h3>
          <div class="grid grid-cols-2 gap-2">
            <div class="stat bg-base-200 rounded-lg p-2">
              <div class="stat-title text-xs">Total Workers</div>
              <div class="stat-value text-sm text-info" id="totalWorkers">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-2">
              <div class="stat-title text-xs">Busy Workers</div>
              <div class="stat-value text-sm text-warning" id="busyWorkers">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-2">
              <div class="stat-title text-xs">Idle Workers</div>
              <div class="stat-value text-sm text-success" id="idleWorkers">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-2">
              <div class="stat-title text-xs">Queued Jobs</div>
              <div class="stat-value text-sm text-error" id="queuedJobs">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-2">
              <div class="stat-title text-xs">Success Count</div>
              <div class="stat-value text-sm text-success" id="successCount">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-2">
              <div class="stat-title text-xs">Failure Count</div>
              <div class="stat-value text-sm text-error" id="failureCount">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-2">
              <div class="stat-title text-xs">Avg Execution (ms)</div>
              <div class="stat-value text-sm text-warning" id="avgExecution">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-2">
              <div class="stat-title text-xs">Peak Workers</div>
              <div class="stat-value text-sm text-neutral" id="peakWorkers">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-2">
              <div class="stat-title text-xs">Total Exec Time (ms)</div>
              <div class="stat-value text-sm text-neutral" id="totalExecTime">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-2">
              <div class="stat-title text-xs">Avg Queue Wait (ms)</div>
              <div class="stat-value text-sm text-warning" id="avgQueueWait">-</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}