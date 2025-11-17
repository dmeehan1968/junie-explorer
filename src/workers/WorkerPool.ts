import path from "node:path"
import { Job } from "./Job"
import { JobScheduler } from "./JobScheduler"
import { MetricsCollector } from "./MetricsCollector"
import { PoolMetrics } from "./PoolMetrics"
import { WorkerExecutionError } from "./WorkerExecutionError"
import { WorkerManager } from "./WorkerManager"
import { WorkerPoolError } from "./WorkerPoolError"
import { WorkerPoolOptions } from "./WorkerPoolOptions"
import { WorkerSpawnError } from "./WorkerSpawnError"

// Constants
const DEFAULT_IDLE_TIMEOUT_MS = 5000
const DEFAULT_POOL_NAME = 'worker-pool'
const DEFAULT_HARDWARE_CONCURRENCY = 4

/**
 * A high-performance worker pool for managing concurrent task execution.
 * 
 * Features:
 * - Dynamic scaling between min/max concurrency limits
 * - Round-robin worker assignment for load balancing
 * - Automatic idle worker cleanup
 * - Comprehensive metrics collection
 * - Type-safe job execution
 * - Graceful error handling and recovery
 * 
 * @example
 * ```typescript
 * const pool = new WorkerPool({
 *   minConcurrency: 2,
 *   maxConcurrency: 8,
 *   workerPath: './my-worker.js',
 *   name: 'image-processor'
 * });
 * 
 * const result = await pool.execute({ imageUrl: 'http://example.com/image.jpg' });
 * console.log('Processed:', result);
 * 
 * await pool.shutdown();
 * ```
 */
export class WorkerPool<TIn extends object, TOut extends object> {
  private readonly minConcurrency: number
  private readonly maxConcurrency: number
  private readonly workerPath: string
  private readonly idleTimeoutMs: number
  private readonly errorHandler?: (e: WorkerPoolError) => void

  /** Human-friendly name for logging/metrics */
  public readonly name: string

  private readonly workerManager: WorkerManager<TIn, TOut>
  private readonly jobScheduler: JobScheduler<TIn, TOut>
  private readonly metricsCollector: MetricsCollector

  /**
   * Creates a new WorkerPool instance
   * 
   * @param options - Configuration options for the worker pool
   * @throws {WorkerSpawnError} If initial worker spawning fails
   */
  constructor(options: WorkerPoolOptions) {
    // Validate and normalize options
    const {
      minConcurrency: rawMin,
      maxConcurrency: rawMax,
      workerPath,
      idleTimeoutMs,
      errorHandler,
      name,
      onFileIOStats
    } = options

    this.minConcurrency = Math.max(0, Number.isFinite(rawMin) ? rawMin : 0)
    this.maxConcurrency = Math.max(
      this.minConcurrency,
      Number.isFinite(rawMax) ? rawMax : this.minConcurrency
    )
    
    // Use fallback for environments without navigator.hardwareConcurrency
    const hardwareConcurrency = typeof navigator !== 'undefined' && navigator.hardwareConcurrency 
      ? navigator.hardwareConcurrency 
      : DEFAULT_HARDWARE_CONCURRENCY
    
    this.maxConcurrency = Math.min(this.maxConcurrency, hardwareConcurrency)
    this.workerPath = workerPath
    this.idleTimeoutMs = idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS
    this.errorHandler = errorHandler

    // Generate name from provided name or worker file basename
    this.name = this.generatePoolName(name, workerPath)

    // Initialize components
    this.metricsCollector = new MetricsCollector()
    this.jobScheduler = new JobScheduler<TIn, TOut>()
    this.workerManager = new WorkerManager<TIn, TOut>(
      this.workerPath,
      this.idleTimeoutMs,
      this.minConcurrency,
      (executionTime) => this.metricsCollector.recordSuccess(executionTime),
      (executionTime) => this.metricsCollector.recordFailure(executionTime),
      () => this.schedule(),
      this.errorHandler,
      onFileIOStats
    )

    try {
      // Pre-warm to minimum concurrency
      this.initializeMinWorkers()
    } catch (error) {
      throw new WorkerSpawnError(`Failed to initialize worker pool: ${error}`, error)
    }
  }

  private generatePoolName(name: string | undefined, workerPath: string): string {
    if (name && name.trim().length) {
      return name.trim()
    }
    
    try {
      return path.parse(workerPath).name
    } catch {
      return DEFAULT_POOL_NAME
    }
  }

  private initializeMinWorkers(): void {
    for (let i = 0; i < this.minConcurrency; i++) {
      this.workerManager.spawnWorker()
      this.metricsCollector.updatePeakWorkerCount(this.workerManager.workerCount)
    }
  }


  private schedule(): void {
    // Process queued jobs with available workers
    while (this.jobScheduler.hasJobs() && this.workerManager.idleCount > 0) {
      const job = this.jobScheduler.dequeue()
      const worker = this.workerManager.getIdleWorker()
      
      if (job && worker) {
        const queueWaitTime = Date.now() - job.enqueuedAt.getTime()
        this.metricsCollector.recordQueueWaitTime(queueWaitTime)
        
        try {
          this.workerManager.assignJob(worker, job)
        } catch (error) {
          // Return worker to idle and reject job
          this.workerManager.returnWorkerToIdle(worker.worker)
          this.metricsCollector.recordFailure(0)
          job.reject(error)
        }
      }
    }

    // Spawn new workers if needed and allowed
    while (
      this.jobScheduler.hasJobs() && 
      this.workerManager.workerCount < this.maxConcurrency
    ) {
      try {
        this.workerManager.spawnWorker()
        this.metricsCollector.updatePeakWorkerCount(this.workerManager.workerCount)
        
        // Immediately assign job to new worker if available
        if (this.jobScheduler.hasJobs()) {
          const job = this.jobScheduler.dequeue()
          const worker = this.workerManager.getIdleWorker()
          
          if (job && worker) {
            const queueWaitTime = Date.now() - job.enqueuedAt.getTime()
            this.metricsCollector.recordQueueWaitTime(queueWaitTime)
            
            try {
              this.workerManager.assignJob(worker, job)
            } catch (error) {
              this.workerManager.returnWorkerToIdle(worker.worker)
              this.metricsCollector.recordFailure(0)
              job.reject(error)
            }
          }
        }
      } catch (error) {
        // If we can't spawn more workers, stop trying
        const spawnError = new WorkerSpawnError(`Failed to spawn additional worker: ${error}`, error)
        this.errorHandler?.(spawnError)
        break
      }
    }
  }

  /**
   * Executes a job using an available worker
   * 
   * @param data - Input data for the worker
   * @returns Promise that resolves with the worker's output
   * @throws {WorkerExecutionError} If the worker fails to process the job
   */
  public execute(data: TIn): Promise<TOut> {
    return new Promise<TOut>((resolve, reject) => {
      const job: Job<TIn, TOut> = {
        data,
        resolve,
        reject,
        enqueuedAt: new Date()
      }
      
      this.jobScheduler.enqueue(job)
      this.schedule()
    })
  }

  /**
   * Gets current pool metrics
   * 
   * @returns Current metrics including success/failure counts, timing data, and worker counts
   */
  public getMetrics(): PoolMetrics {
    return this.metricsCollector.getMetrics(
      this.jobScheduler.queuedCount,
      this.workerManager.busyCount,
      this.workerManager.idleCount
    )
  }

  /**
   * Resets all metrics to zero
   */
  public resetMetrics(): void {
    this.metricsCollector.reset()
  }

  /**
   * Gets the current number of queued jobs
   */
  public get queuedCount(): number {
    return this.jobScheduler.queuedCount
  }

  /**
   * Gets the current number of busy workers
   */
  public get busyCount(): number {
    return this.workerManager.busyCount
  }

  /**
   * Gets the current number of idle workers
   */
  public get idleCount(): number {
    return this.workerManager.idleCount
  }

  /**
   * Gets the total number of workers (busy + idle)
   */
  public get workerCount(): number {
    return this.workerManager.workerCount
  }

  /**
   * Legacy success count getter - use getMetrics() for comprehensive metrics
   * @deprecated Use getMetrics().successCount instead
   */
  public get successCount(): number {
    return this.getMetrics().successCount
  }

  /**
   * Legacy failure count getter - use getMetrics() for comprehensive metrics
   * @deprecated Use getMetrics().failureCount instead
   */
  public get failureCount(): number {
    return this.getMetrics().failureCount
  }

  /**
   * Gracefully shuts down the worker pool
   * - Terminates all workers
   * - Clears job queues
   * - Rejects any pending jobs
   * 
   * @returns Promise that resolves when shutdown is complete
   */
  public async shutdown(): Promise<void> {
    // Reject all pending jobs
    while (this.jobScheduler.hasJobs()) {
      const job = this.jobScheduler.dequeue()
      if (job) {
        job.reject(new WorkerPoolError('Worker pool is shutting down'))
      }
    }

    // Clear the job queue
    this.jobScheduler.clear()
    
    // Shutdown worker manager
    this.workerManager.shutdown()
    
    // Reset metrics
    this.metricsCollector.reset()
  }
}
