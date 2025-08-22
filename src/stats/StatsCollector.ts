import { WorkerPool } from '../workers/WorkerPool.js'
import { SystemStats, AggregatedStats, TimePeriod, StatsQuery } from './StatsTypes.js'

export class StatsCollector {
  private stats: SystemStats[] = []
  private intervalId: NodeJS.Timeout | null = null
  private workerPools: Set<WorkerPool<any, any>> = new Set()

  constructor() {
    this.startCollection()
  }

  public registerWorkerPool(pool: WorkerPool<any, any>): void {
    this.workerPools.add(pool)
  }

  public unregisterWorkerPool(pool: WorkerPool<any, any>): void {
    this.workerPools.delete(pool)
  }

  private startCollection(): void {
    this.intervalId = setInterval(() => {
      this.collectStats()
    }, 1000)
  }

  private collectStats(): void {
    const now = Date.now()
    const memUsage = process.memoryUsage()
    
    const aggregatedWorkerStats = this.aggregateWorkerPoolStats()

    const stats: SystemStats = {
      timestamp: now,
      memory: {
        used: memUsage.rss,
        free: 0, // Node.js doesn't provide free memory directly
        total: memUsage.rss + memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      },
      workerPool: aggregatedWorkerStats
    }

    this.stats.push(stats)
    
    // Keep only last 12 hours of data (43200 seconds)
    const cutoffTime = now - 12 * 60 * 60 * 1000
    this.stats = this.stats.filter(s => s.timestamp > cutoffTime)
  }

  public aggregateWorkerPoolStats() {
    let total = {
      successCount: 0,
      failureCount: 0,
      averageExecutionTimeMs: 0,
      totalExecutionTimeMs: 0,
      queuedCount: 0,
      busyCount: 0,
      idleCount: 0,
      workerCount: 0,
      peakWorkerCount: 0,
      averageQueueWaitTimeMs: 0
    }

    if (this.workerPools.size === 0) {
      return total
    }

    let totalExecTime = 0
    let totalQueueTime = 0
    let poolCount = 0

    for (const pool of this.workerPools) {
      const metrics = pool.getMetrics()
      total.successCount += metrics.successCount
      total.failureCount += metrics.failureCount
      total.queuedCount += metrics.queuedCount
      total.busyCount += metrics.busyCount
      total.idleCount += metrics.idleCount
      total.workerCount += metrics.workerCount
      total.peakWorkerCount = Math.max(total.peakWorkerCount, metrics.peakWorkerCount)
      
      totalExecTime += metrics.averageExecutionTimeMs
      totalQueueTime += metrics.averageQueueWaitTimeMs
      total.totalExecutionTimeMs += metrics.totalExecutionTimeMs
      poolCount++
    }

    total.averageExecutionTimeMs = poolCount > 0 ? totalExecTime / poolCount : 0
    total.averageQueueWaitTimeMs = poolCount > 0 ? totalQueueTime / poolCount : 0

    return total
  }

  public getRecentDataPoints(maxPoints: number = 60): SystemStats[] {
    const recentStats = this.stats.slice(-maxPoints)
    return recentStats
  }

  public getStats(query: StatsQuery): AggregatedStats {
    const now = Date.now()
    const periodMs = this.getPeriodMs(query.period)
    const startTime = now - periodMs
    
    const relevantStats = this.stats.filter(s => s.timestamp >= startTime)
    
    if (relevantStats.length === 0) {
      return this.createEmptyAggregatedStats(startTime, now, query.intervalMs || 1000)
    }

    const intervalMs = query.intervalMs || this.getOptimalInterval(query.period)
    const aggregated = this.aggregateStats(relevantStats, intervalMs)
    
    return {
      ...aggregated,
      period: {
        startTime,
        endTime: now,
        intervalMs,
        sampleCount: relevantStats.length
      }
    }
  }

  private getPeriodMs(period: TimePeriod): number {
    switch (period) {
      case '1m': return 60 * 1000
      case '5m': return 5 * 60 * 1000
      case '15m': return 15 * 60 * 1000
      case '1h': return 60 * 60 * 1000
      case '6h': return 6 * 60 * 60 * 1000
      case '12h': return 12 * 60 * 60 * 1000
      default: return 60 * 1000
    }
  }

  private getOptimalInterval(period: TimePeriod): number {
    switch (period) {
      case '1m': return 1000    // 1 second
      case '5m': return 5000    // 5 seconds
      case '15m': return 15000  // 15 seconds
      case '1h': return 60000   // 1 minute
      case '6h': return 300000  // 5 minutes
      case '12h': return 600000 // 10 minutes
      default: return 1000
    }
  }

  private aggregateStats(stats: SystemStats[], intervalMs: number): Omit<AggregatedStats, 'period'> {
    if (stats.length === 0) {
      return this.createEmptyAggregation()
    }

    const memory = this.aggregateMemoryStats(stats)
    const workerPool = this.aggregateWorkerPoolStatsData(stats)

    return { memory, workerPool }
  }

  private aggregateMemoryStats(stats: SystemStats[]) {
    const memoryStats = stats.map(s => s.memory)
    
    return {
      used: this.getMinMaxAvg(memoryStats.map(m => m.used)),
      free: this.getMinMaxAvg(memoryStats.map(m => m.free)),
      total: this.getMinMaxAvg(memoryStats.map(m => m.total)),
      heapUsed: this.getMinMaxAvg(memoryStats.map(m => m.heapUsed)),
      heapTotal: this.getMinMaxAvg(memoryStats.map(m => m.heapTotal)),
      external: this.getMinMaxAvg(memoryStats.map(m => m.external))
    }
  }

  private aggregateWorkerPoolStatsData(stats: SystemStats[]) {
    const workerStats = stats.map(s => s.workerPool)
    
    return {
      successCount: this.getMinMaxAvg(workerStats.map(w => w.successCount)),
      failureCount: this.getMinMaxAvg(workerStats.map(w => w.failureCount)),
      averageExecutionTimeMs: this.getMinMaxAvg(workerStats.map(w => w.averageExecutionTimeMs)),
      totalExecutionTimeMs: this.getMinMaxAvg(workerStats.map(w => w.totalExecutionTimeMs)),
      queuedCount: this.getMinMaxAvg(workerStats.map(w => w.queuedCount)),
      busyCount: this.getMinMaxAvg(workerStats.map(w => w.busyCount)),
      idleCount: this.getMinMaxAvg(workerStats.map(w => w.idleCount)),
      workerCount: this.getMinMaxAvg(workerStats.map(w => w.workerCount)),
      peakWorkerCount: this.getMinMaxAvg(workerStats.map(w => w.peakWorkerCount)),
      averageQueueWaitTimeMs: this.getMinMaxAvg(workerStats.map(w => w.averageQueueWaitTimeMs))
    }
  }

  private getMinMaxAvg(values: number[]): { min: number; max: number; avg: number } {
    if (values.length === 0) return { min: 0, max: 0, avg: 0 }
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    
    return { min, max, avg }
  }

  private createEmptyAggregatedStats(startTime: number, endTime: number, intervalMs: number): AggregatedStats {
    return {
      ...this.createEmptyAggregation(),
      period: {
        startTime,
        endTime,
        intervalMs,
        sampleCount: 0
      }
    }
  }

  private createEmptyAggregation() {
    const empty = { min: 0, max: 0, avg: 0 }
    
    return {
      memory: {
        used: empty,
        free: empty,
        total: empty,
        heapUsed: empty,
        heapTotal: empty,
        external: empty
      },
      workerPool: {
        successCount: empty,
        failureCount: empty,
        averageExecutionTimeMs: empty,
        totalExecutionTimeMs: empty,
        queuedCount: empty,
        busyCount: empty,
        idleCount: empty,
        workerCount: empty,
        peakWorkerCount: empty,
        averageQueueWaitTimeMs: empty
      }
    }
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}