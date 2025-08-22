import fs from 'fs'
import fsExtra from 'fs-extra'
import { FileIOStats } from './StatsTypes.js'

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

export class FileIOCollector {
  private readOps: OperationMetrics = this.createEmptyMetrics()
  private writeOps: OperationMetrics = this.createEmptyMetrics()
  private directoryOps: OperationMetrics = this.createEmptyMetrics()
  private checkOps: OperationMetrics = this.createEmptyMetrics()
  
  private lastCollectionTime: number = Date.now()
  private originalMethods: Map<string, Function> = new Map()
  private isInitialized: boolean = false

  constructor() {
    this.initializeMonitoring()
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

  private initializeMonitoring(): void {
    if (this.isInitialized) return
    this.isInitialized = true

    // Store original methods for fs
    this.originalMethods.set('fs.readFile', fs.readFile)
    this.originalMethods.set('fs.readFileSync', fs.readFileSync)
    this.originalMethods.set('fs.writeFile', fs.writeFile)
    this.originalMethods.set('fs.writeFileSync', fs.writeFileSync)
    this.originalMethods.set('fs.readdir', fs.readdir)
    this.originalMethods.set('fs.readdirSync', fs.readdirSync)
    this.originalMethods.set('fs.stat', fs.stat)
    this.originalMethods.set('fs.statSync', fs.statSync)
    this.originalMethods.set('fs.lstat', fs.lstat)
    this.originalMethods.set('fs.lstatSync', fs.lstatSync)
    this.originalMethods.set('fs.existsSync', fs.existsSync)
    this.originalMethods.set('fs.access', fs.access)

    // Store original methods for fs-extra
    this.originalMethods.set('fsExtra.readFile', fsExtra.readFile)
    this.originalMethods.set('fsExtra.readFileSync', fsExtra.readFileSync)
    this.originalMethods.set('fsExtra.writeFile', fsExtra.writeFile)
    this.originalMethods.set('fsExtra.writeFileSync', fsExtra.writeFileSync)
    this.originalMethods.set('fsExtra.readdir', fsExtra.readdir)
    this.originalMethods.set('fsExtra.readdirSync', fsExtra.readdirSync)
    this.originalMethods.set('fsExtra.stat', fsExtra.stat)
    this.originalMethods.set('fsExtra.statSync', fsExtra.statSync)
    this.originalMethods.set('fsExtra.lstat', fsExtra.lstat)
    this.originalMethods.set('fsExtra.lstatSync', fsExtra.lstatSync)
    this.originalMethods.set('fsExtra.existsSync', fsExtra.existsSync)
    this.originalMethods.set('fsExtra.access', fsExtra.access)

    // Wrap async read operations
    fs.readFile = this.wrapAsyncOperation(
      fs.readFile.bind(fs),
      'read',
      (args, result) => result?.length || 0
    ) as typeof fs.readFile

    // Wrap sync read operations  
    fs.readFileSync = this.wrapSyncOperation(
      fs.readFileSync.bind(fs),
      'read',
      (args, result) => (typeof result === 'string' ? Buffer.byteLength(result) : result?.length || 0)
    ) as typeof fs.readFileSync

    // Wrap async write operations
    fs.writeFile = this.wrapAsyncOperation(
      fs.writeFile.bind(fs),
      'write',
      (args) => {
        const data = args[1]
        if (typeof data === 'string') return Buffer.byteLength(data)
        if (Buffer.isBuffer(data)) return data.length
        return 0
      }
    ) as typeof fs.writeFile

    // Wrap sync write operations
    fs.writeFileSync = this.wrapSyncOperation(
      fs.writeFileSync.bind(fs),
      'write',
      (args) => {
        const data = args[1]
        if (typeof data === 'string') return Buffer.byteLength(data)
        if (Buffer.isBuffer(data)) return data.length
        return 0
      }
    ) as typeof fs.writeFileSync

    // Wrap directory operations
    fs.readdir = this.wrapAsyncOperation(
      fs.readdir.bind(fs),
      'directory'
    ) as typeof fs.readdir

    fs.readdirSync = this.wrapSyncOperation(
      fs.readdirSync.bind(fs),
      'directory'
    ) as typeof fs.readdirSync

    fs.stat = this.wrapAsyncOperation(
      fs.stat.bind(fs),
      'directory'
    ) as typeof fs.stat

    ;(fs as any).statSync = this.wrapSyncOperation(
      fs.statSync.bind(fs),
      'directory'
    )

    ;(fs as any).lstat = this.wrapAsyncOperation(
      fs.lstat.bind(fs),
      'directory'
    )

    ;(fs as any).lstatSync = this.wrapSyncOperation(
      fs.lstatSync.bind(fs),
      'directory'
    )

    // Wrap check operations
    fs.existsSync = this.wrapSyncOperation(
      fs.existsSync.bind(fs),
      'check'
    ) as typeof fs.existsSync

    fs.access = this.wrapAsyncOperation(
      fs.access.bind(fs),
      'check'
    ) as typeof fs.access

    // Wrap fs-extra operations
    ;(fsExtra as any).readFile = this.wrapAsyncOperation(
      fsExtra.readFile.bind(fsExtra),
      'read',
      (args, result) => result?.length || 0
    )

    ;(fsExtra as any).readFileSync = this.wrapSyncOperation(
      fsExtra.readFileSync.bind(fsExtra),
      'read',
      (args, result) => (typeof result === 'string' ? Buffer.byteLength(result) : result?.length || 0)
    )

    ;(fsExtra as any).writeFile = this.wrapAsyncOperation(
      fsExtra.writeFile.bind(fsExtra),
      'write',
      (args) => {
        const data = args[1]
        if (typeof data === 'string') return Buffer.byteLength(data)
        if (Buffer.isBuffer(data)) return data.length
        return 0
      }
    )

    ;(fsExtra as any).writeFileSync = this.wrapSyncOperation(
      fsExtra.writeFileSync.bind(fsExtra),
      'write',
      (args) => {
        const data = args[1]
        if (typeof data === 'string') return Buffer.byteLength(data)
        if (Buffer.isBuffer(data)) return data.length
        return 0
      }
    )

    ;(fsExtra as any).readdir = this.wrapAsyncOperation(
      fsExtra.readdir.bind(fsExtra),
      'directory'
    )

    ;(fsExtra as any).readdirSync = this.wrapSyncOperation(
      fsExtra.readdirSync.bind(fsExtra),
      'directory'
    )

    ;(fsExtra as any).stat = this.wrapAsyncOperation(
      fsExtra.stat.bind(fsExtra),
      'directory'
    )

    ;(fsExtra as any).statSync = this.wrapSyncOperation(
      fsExtra.statSync.bind(fsExtra),
      'directory'
    )

    ;(fsExtra as any).lstat = this.wrapAsyncOperation(
      fsExtra.lstat.bind(fsExtra),
      'directory'
    )

    ;(fsExtra as any).lstatSync = this.wrapSyncOperation(
      fsExtra.lstatSync.bind(fsExtra),
      'directory'
    )

    ;(fsExtra as any).existsSync = this.wrapSyncOperation(
      fsExtra.existsSync.bind(fsExtra),
      'check'
    )

    ;(fsExtra as any).access = this.wrapAsyncOperation(
      fsExtra.access.bind(fsExtra),
      'check'
    )
  }

  private wrapAsyncOperation<T extends Function>(
    originalFn: T,
    operationType: 'read' | 'write' | 'directory' | 'check',
    getSizeFromResult?: (args: any[], result: any) => number
  ): T {
    return ((...args: any[]) => {
      const startTime = Date.now()
      const record: OperationRecord = { startTime }
      
      const callback = args[args.length - 1]
      if (typeof callback === 'function') {
        args[args.length - 1] = (error: any, result: any) => {
          record.endTime = Date.now()
          record.error = !!error
          
          if (!error && getSizeFromResult) {
            record.size = getSizeFromResult(args, result)
          }
          
          this.recordOperation(operationType, record)
          callback(error, result)
        }
      }
      
      return originalFn(...args)
    }) as unknown as T
  }

  private wrapSyncOperation<T extends Function>(
    originalFn: T,
    operationType: 'read' | 'write' | 'directory' | 'check',
    getSizeFromArgs?: (args: any[], result?: any) => number
  ): T {
    return ((...args: any[]) => {
      const startTime = Date.now()
      const record: OperationRecord = { startTime }
      
      try {
        const result = originalFn(...args)
        record.endTime = Date.now()
        record.error = false
        
        if (getSizeFromArgs) {
          record.size = getSizeFromArgs(args, result)
        }
        
        this.recordOperation(operationType, record)
        return result
      } catch (error) {
        record.endTime = Date.now()
        record.error = true
        this.recordOperation(operationType, record)
        throw error
      }
    }) as unknown as T
  }

  private recordOperation(
    operationType: 'read' | 'write' | 'directory' | 'check',
    record: OperationRecord
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

  public resetStats(): void {
    this.readOps = this.createEmptyMetrics()
    this.writeOps = this.createEmptyMetrics()
    this.directoryOps = this.createEmptyMetrics()
    this.checkOps = this.createEmptyMetrics()
    this.lastCollectionTime = Date.now()
  }

  public stop(): void {
    if (!this.isInitialized) return
    
    // Restore original methods
    for (const [methodName, originalMethod] of this.originalMethods) {
      if (methodName.startsWith('fs.')) {
        const fsMethodName = methodName.substring(3)
        ;(fs as any)[fsMethodName] = originalMethod
      } else if (methodName.startsWith('fsExtra.')) {
        const fsExtraMethodName = methodName.substring(9)
        ;(fsExtra as any)[fsExtraMethodName] = originalMethod
      }
    }
    
    this.originalMethods.clear()
    this.isInitialized = false
  }
}