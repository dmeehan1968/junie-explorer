export interface SystemStats {
  timestamp: number
  memory: {
    used: number
    free: number
    total: number
    heapUsed: number
    heapTotal: number
    external: number
  }
  workerPool: {
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
}

export interface AggregatedStats {
  memory: {
    used: { min: number; max: number; avg: number }
    free: { min: number; max: number; avg: number }
    total: { min: number; max: number; avg: number }
    heapUsed: { min: number; max: number; avg: number }
    heapTotal: { min: number; max: number; avg: number }
    external: { min: number; max: number; avg: number }
  }
  workerPool: {
    successCount: { min: number; max: number; avg: number }
    failureCount: { min: number; max: number; avg: number }
    averageExecutionTimeMs: { min: number; max: number; avg: number }
    totalExecutionTimeMs: { min: number; max: number; avg: number }
    queuedCount: { min: number; max: number; avg: number }
    busyCount: { min: number; max: number; avg: number }
    idleCount: { min: number; max: number; avg: number }
    workerCount: { min: number; max: number; avg: number }
    peakWorkerCount: { min: number; max: number; avg: number }
    averageQueueWaitTimeMs: { min: number; max: number; avg: number }
  }
  period: {
    startTime: number
    endTime: number
    intervalMs: number
    sampleCount: number
  }
}

export type TimePeriod = '1m' | '5m' | '15m' | '1h' | '6h' | '12h'

export interface StatsQuery {
  period: TimePeriod
  intervalMs?: number
}