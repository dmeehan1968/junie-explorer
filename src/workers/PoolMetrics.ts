/**
 * Metrics collected by the worker pool
 */
export interface PoolMetrics {
  successCount: number
  failureCount: number
  averageExecutionTimeMs: number
  totalExecutionTimeMs: number
  queuedCount: number
  busyCount: number
  idleCount: number
  workerCount: number
  peakWorkerCount: number
  averageQueueWaitTimeMs: number
}