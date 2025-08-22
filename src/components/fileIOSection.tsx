import { Html } from "@kitajs/html"

export const FileIOSection = () => {
  return (
    <div class="grid grid-cols-3 gap-6 mb-6">
      {/* File I/O Combined Chart - 2/3 width */}
      <div class="col-span-2 card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">File I/O Throughput & Operations</h2>
          <div class="h-80">
            <canvas id="fileIOCombinedChart"></canvas>
          </div>
        </div>
      </div>

      {/* File I/O Metrics - 1/3 width */}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="text-lg font-semibold mb-3 text-success">File I/O Metrics</h3>
          <div class="grid grid-cols-1 gap-3">
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Total Operations/sec</div>
              <div class="stat-value text-sm text-success" id="totalIOOpsPerSec">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Read Ops/sec</div>
              <div class="stat-value text-sm text-info" id="readOpsPerSec">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Write Ops/sec</div>
              <div class="stat-value text-sm text-warning" id="writeOpsPerSec">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Total Bytes (MB)</div>
              <div class="stat-value text-sm text-neutral" id="totalIOBytes">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Read Throughput (MB/s)</div>
              <div class="stat-value text-sm text-primary" id="readThroughput">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Write Throughput (MB/s)</div>
              <div class="stat-value text-sm text-secondary" id="writeThroughput">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Total Errors</div>
              <div class="stat-value text-sm text-error" id="totalIOErrors">-</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-3">
              <div class="stat-title text-xs">Avg Duration (ms)</div>
              <div class="stat-value text-sm text-accent" id="avgIODuration">-</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}