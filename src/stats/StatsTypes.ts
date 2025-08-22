export interface FileIOStats {
  read: {
    operationCount: number
    bytesRead: number
    averageDurationMs: number
    minDurationMs: number
    maxDurationMs: number
    errorCount: number
    operationsPerSecond: number
    throughputMBps: number
  }
  write: {
    operationCount: number
    bytesWritten: number
    averageDurationMs: number
    minDurationMs: number
    maxDurationMs: number
    errorCount: number
    operationsPerSecond: number
    throughputMBps: number
  }
  directory: {
    operationCount: number
    averageDurationMs: number
    minDurationMs: number
    maxDurationMs: number
    errorCount: number
    operationsPerSecond: number
  }
  check: {
    operationCount: number
    averageDurationMs: number
    minDurationMs: number
    maxDurationMs: number
    errorCount: number
    operationsPerSecond: number
  }
  total: {
    operationCount: number
    bytesTotal: number
    errorCount: number
    operationsPerSecond: number
  }
}

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
  fileIO: FileIOStats
}

export interface AggregatedFileIOStats {
  read: {
    operationCount: { min: number; max: number; avg: number }
    bytesRead: { min: number; max: number; avg: number }
    averageDurationMs: { min: number; max: number; avg: number }
    errorCount: { min: number; max: number; avg: number }
    operationsPerSecond: { min: number; max: number; avg: number }
    throughputMBps: { min: number; max: number; avg: number }
  }
  write: {
    operationCount: { min: number; max: number; avg: number }
    bytesWritten: { min: number; max: number; avg: number }
    averageDurationMs: { min: number; max: number; avg: number }
    errorCount: { min: number; max: number; avg: number }
    operationsPerSecond: { min: number; max: number; avg: number }
    throughputMBps: { min: number; max: number; avg: number }
  }
  directory: {
    operationCount: { min: number; max: number; avg: number }
    averageDurationMs: { min: number; max: number; avg: number }
    errorCount: { min: number; max: number; avg: number }
    operationsPerSecond: { min: number; max: number; avg: number }
  }
  check: {
    operationCount: { min: number; max: number; avg: number }
    averageDurationMs: { min: number; max: number; avg: number }
    errorCount: { min: number; max: number; avg: number }
    operationsPerSecond: { min: number; max: number; avg: number }
  }
  total: {
    operationCount: { min: number; max: number; avg: number }
    bytesTotal: { min: number; max: number; avg: number }
    errorCount: { min: number; max: number; avg: number }
    operationsPerSecond: { min: number; max: number; avg: number }
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
  fileIO: AggregatedFileIOStats
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

export interface WorkerFileIOOperation {
  type: 'read' | 'write' | 'directory' | 'check'
  duration: number
  size?: number
  error: boolean
  timestamp: number
}

export interface WorkerFileIOStats {
  operations: WorkerFileIOOperation[]
  workerId: string
}