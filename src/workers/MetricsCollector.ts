import { PoolMetrics } from "./PoolMetrics"

/**
 * Manages metrics collection and calculation for the worker pool
 */
export class MetricsCollector {
  private successCount = 0
  private failureCount = 0
  private totalExecutionTimeMs = 0
  private peakWorkerCount = 0
  private totalQueueWaitTimeMs = 0
  private completedJobsCount = 0

  recordSuccess(executionTimeMs: number): void {
    this.successCount++
    this.totalExecutionTimeMs += executionTimeMs
    this.completedJobsCount++
  }

  recordFailure(executionTimeMs: number): void {
    this.failureCount++
    this.totalExecutionTimeMs += executionTimeMs
    this.completedJobsCount++
  }

  recordQueueWaitTime(waitTimeMs: number): void {
    this.totalQueueWaitTimeMs += waitTimeMs
  }

  updatePeakWorkerCount(currentCount: number): void {
    if (currentCount > this.peakWorkerCount) {
      this.peakWorkerCount = currentCount
    }
  }

  getMetrics(queuedCount: number, busyCount: number, idleCount: number): PoolMetrics {
    return {
      successCount: this.successCount,
      failureCount: this.failureCount,
      averageExecutionTimeMs: this.completedJobsCount > 0 ? this.totalExecutionTimeMs / this.completedJobsCount : 0,
      totalExecutionTimeMs: this.totalExecutionTimeMs,
      queuedCount,
      busyCount,
      idleCount,
      workerCount: busyCount + idleCount,
      peakWorkerCount: this.peakWorkerCount,
      averageQueueWaitTimeMs: this.completedJobsCount > 0 ? this.totalQueueWaitTimeMs / this.completedJobsCount : 0,
    }
  }

  reset(): void {
    this.successCount = 0
    this.failureCount = 0
    this.totalExecutionTimeMs = 0
    this.peakWorkerCount = 0
    this.totalQueueWaitTimeMs = 0
    this.completedJobsCount = 0
  }
}