import fs from 'fs'
import fsExtra from 'fs-extra'
import { FileIOStats, WorkerFileIOStats, WorkerFileIOOperation } from './StatsTypes.js'
import { BaseFileIOMonitor, FileIOOperationType } from './BaseFileIOMonitor.js'

interface OperationRecord {
  startTime: number
  endTime?: number
  size?: number
  error?: boolean
}

interface OperationMetrics {
  count: number
  totalBytes: number
  totalDuration: number
  minDuration: number
  maxDuration: number
  errorCount: number
  operations: OperationRecord[]
}

export class FileIOCollector extends BaseFileIOMonitor {
  private readOps: OperationMetrics = this.createEmptyMetrics()
  private writeOps: OperationMetrics = this.createEmptyMetrics()
  private directoryOps: OperationMetrics = this.createEmptyMetrics()
  private checkOps: OperationMetrics = this.createEmptyMetrics()
  
  private lastCollectionTime: number = Date.now()

  constructor() {
    super()
    this.initializeMainProcessMonitoring()
  }

  private createEmptyMetrics(): OperationMetrics {
    return {
      count: 0,
      totalBytes: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errorCount: 0,
      operations: []
    }
  }

  private initializeMainProcessMonitoring(): void {
    // Initialize monitoring for both fs and fs-extra modules
    this.initializeMonitoring([
      { name: 'fs', module: fs },
      { name: 'fsExtra', module: fsExtra }
    ])
  }

  protected recordOperation(
    operationType: FileIOOperationType,
    startTime: number,
    endTime: number,
    size?: number,
    error?: boolean
  ): void {
    const record: OperationRecord = {
      startTime,
      endTime,
      size,
      error
    }
    
    this.recordOperationInternal(operationType, record, true)
  }

  private recordOperationInternal(
    operationType: 'read' | 'write' | 'directory' | 'check',
    record: OperationRecord,
    skipDebugLog: boolean = false
  ): void {
    const metrics = this.getMetricsForType(operationType)
    const duration = (record.endTime || Date.now()) - record.startTime
    
    metrics.count++
    metrics.totalDuration += duration
    metrics.minDuration = Math.min(metrics.minDuration, duration)
    metrics.maxDuration = Math.max(metrics.maxDuration, duration)
    
    if (record.error) {
      metrics.errorCount++
    }
    
    if (record.size) {
      metrics.totalBytes += record.size
    }
    
    metrics.operations.push(record)
    
    // Debug logging (only for main process operations)
    if (!skipDebugLog) {
      console.log(`FileIO (main): ${operationType} operation - duration: ${duration}ms, size: ${record.size || 0} bytes, error: ${!!record.error}`)
    }
    
    // Keep only recent operations for per-second calculations
    const cutoffTime = Date.now() - 60000 // Last minute
    metrics.operations = metrics.operations.filter(op => op.startTime > cutoffTime)
  }

  private getMetricsForType(operationType: 'read' | 'write' | 'directory' | 'check'): OperationMetrics {
    switch (operationType) {
      case 'read': return this.readOps
      case 'write': return this.writeOps
      case 'directory': return this.directoryOps
      case 'check': return this.checkOps
    }
  }

  private calculateOperationsPerSecond(metrics: OperationMetrics): number {
    const now = Date.now()
    const recentOps = metrics.operations.filter(op => op.startTime > now - 1000)
    return recentOps.length
  }

  private calculateThroughputMBps(metrics: OperationMetrics): number {
    const now = Date.now()
    const recentOps = metrics.operations.filter(op => op.startTime > now - 1000)
    const totalBytes = recentOps.reduce((sum, op) => sum + (op.size || 0), 0)
    return totalBytes / (1024 * 1024) // Convert to MB/s
  }

  public getStats(): FileIOStats {
    const now = Date.now()
    
    return {
      read: {
        operationCount: this.readOps.count,
        bytesRead: this.readOps.totalBytes,
        averageDurationMs: this.readOps.count > 0 ? this.readOps.totalDuration / this.readOps.count : 0,
        minDurationMs: this.readOps.minDuration === Infinity ? 0 : this.readOps.minDuration,
        maxDurationMs: this.readOps.maxDuration,
        errorCount: this.readOps.errorCount,
        operationsPerSecond: this.calculateOperationsPerSecond(this.readOps),
        throughputMBps: this.calculateThroughputMBps(this.readOps)
      },
      write: {
        operationCount: this.writeOps.count,
        bytesWritten: this.writeOps.totalBytes,
        averageDurationMs: this.writeOps.count > 0 ? this.writeOps.totalDuration / this.writeOps.count : 0,
        minDurationMs: this.writeOps.minDuration === Infinity ? 0 : this.writeOps.minDuration,
        maxDurationMs: this.writeOps.maxDuration,
        errorCount: this.writeOps.errorCount,
        operationsPerSecond: this.calculateOperationsPerSecond(this.writeOps),
        throughputMBps: this.calculateThroughputMBps(this.writeOps)
      },
      directory: {
        operationCount: this.directoryOps.count,
        averageDurationMs: this.directoryOps.count > 0 ? this.directoryOps.totalDuration / this.directoryOps.count : 0,
        minDurationMs: this.directoryOps.minDuration === Infinity ? 0 : this.directoryOps.minDuration,
        maxDurationMs: this.directoryOps.maxDuration,
        errorCount: this.directoryOps.errorCount,
        operationsPerSecond: this.calculateOperationsPerSecond(this.directoryOps)
      },
      check: {
        operationCount: this.checkOps.count,
        averageDurationMs: this.checkOps.count > 0 ? this.checkOps.totalDuration / this.checkOps.count : 0,
        minDurationMs: this.checkOps.minDuration === Infinity ? 0 : this.checkOps.minDuration,
        maxDurationMs: this.checkOps.maxDuration,
        errorCount: this.checkOps.errorCount,
        operationsPerSecond: this.calculateOperationsPerSecond(this.checkOps)
      },
      total: {
        operationCount: this.readOps.count + this.writeOps.count + this.directoryOps.count + this.checkOps.count,
        bytesTotal: this.readOps.totalBytes + this.writeOps.totalBytes,
        errorCount: this.readOps.errorCount + this.writeOps.errorCount + this.directoryOps.errorCount + this.checkOps.errorCount,
        operationsPerSecond: this.calculateOperationsPerSecond(this.readOps) + 
                           this.calculateOperationsPerSecond(this.writeOps) +
                           this.calculateOperationsPerSecond(this.directoryOps) +
                           this.calculateOperationsPerSecond(this.checkOps)
      }
    }
  }

  public mergeWorkerStats(workerStats: WorkerFileIOStats): void {
    // Process each operation from the worker
    for (const operation of workerStats.operations) {
      const record: OperationRecord = {
        startTime: operation.timestamp,
        endTime: operation.timestamp + operation.duration,
        size: operation.size,
        error: operation.error
      }
      
      this.recordOperationInternal(operation.type, record, true) // Skip debug logging for worker operations
    }
    
    // console.log(`FileIO: Merged ${workerStats.operations.length} operations from worker ${workerStats.workerId}`)
  }

  public resetStats(): void {
    this.readOps = this.createEmptyMetrics()
    this.writeOps = this.createEmptyMetrics()
    this.directoryOps = this.createEmptyMetrics()
    this.checkOps = this.createEmptyMetrics()
    this.lastCollectionTime = Date.now()
  }

  // stop() method is inherited from BaseFileIOMonitor
}