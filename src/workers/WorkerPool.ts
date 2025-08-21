import path from "node:path"

// Constants
const DEFAULT_IDLE_TIMEOUT_MS = 5000
const DEFAULT_POOL_NAME = 'worker-pool'
const DEFAULT_HARDWARE_CONCURRENCY = 4

/**
 * Represents a job to be executed by a worker
 */
type Job<TIn, TOut> = {
  data: TIn
  resolve: (value: TOut) => void
  reject: (reason?: any) => void
  enqueuedAt: Date
}

/**
 * Configuration options for WorkerPool
 */
export interface WorkerPoolOptions {
  /** Minimum number of workers to keep alive */
  minConcurrency: number
  /** Maximum number of workers to spawn */
  maxConcurrency: number
  /** Path to the worker script */
  workerPath: string
  /** Time in milliseconds before idle workers are terminated */
  idleTimeoutMs?: number
  /** Handler for worker errors */
  errorHandler?: (e: WorkerPoolError) => void
  /** Human-friendly name for the pool */
  name?: string
}

/**
 * Represents a worker instance with metadata
 */
interface WorkerEntry {
  worker: Worker
  timer?: NodeJS.Timeout
  createdAt: Date
  id: string
}

/**
 * Worker state enumeration
 */
enum WorkerState {
  IDLE = 'idle',
  BUSY = 'busy'
}

/**
 * Success response from worker
 */
interface Success<T> {
  ok: true
  result: T
}

/**
 * Failure response from worker
 */
interface Failure {
  ok: false
  error: any
}

type Response<T> = Success<T> | Failure

/**
 * Custom error types for WorkerPool
 */
export class WorkerPoolError extends Error {
  constructor(message: string, public cause?: any) {
    super(message)
    this.name = 'WorkerPoolError'
  }
}

export class WorkerExecutionError extends WorkerPoolError {
  constructor(message: string, cause?: any) {
    super(message, cause)
    this.name = 'WorkerExecutionError'
  }
}

export class WorkerSpawnError extends WorkerPoolError {
  constructor(message: string, cause?: any) {
    super(message, cause)
    this.name = 'WorkerSpawnError'
  }
}

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

/**
 * Manages metrics collection and calculation for the worker pool
 */
class MetricsCollector {
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
      averageQueueWaitTimeMs: this.completedJobsCount > 0 ? this.totalQueueWaitTimeMs / this.completedJobsCount : 0
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

/**
 * Manages worker lifecycle and state
 */
class WorkerManager<TIn extends object, TOut extends object> {
  private idleWorkers: WorkerEntry[] = []
  private busyWorkers: WorkerEntry[] = []
  private currentJobMap = new Map<Worker, { job: Job<TIn, TOut>; startTime: Date }>()
  private workerIdCounter = 0

  constructor(
    private workerPath: string,
    private idleTimeoutMs: number,
    private minConcurrency: number,
    private onSuccess: (executionTime: number) => void,
    private onFailure: (executionTime: number) => void,
    private onSchedule: () => void,
    private errorHandler?: (e: WorkerPoolError) => void
  ) {}

  /**
   * Creates a new worker and adds it to the idle pool
   */
  spawnWorker(): WorkerEntry {
    try {
      const worker = new Worker(this.workerPath, { type: 'module' })
      const entry: WorkerEntry = {
        worker,
        timer: undefined,
        createdAt: new Date(),
        id: `worker-${++this.workerIdCounter}`
      }

      // Set up message and error handlers
      worker.onmessage = (event: MessageEvent<Response<TOut>>) => {
        const jobInfo = this.currentJobMap.get(worker)
        if (jobInfo) {
          const executionTime = Date.now() - jobInfo.startTime.getTime()
          
          // Resolve or reject the job promise
          if (event.data && event.data.ok) {
            jobInfo.job.resolve(event.data.result)
            this.onSuccess(executionTime)
          } else {
            const error = event.data && !event.data.ok ? (event.data as Failure).error : new Error('Worker returned unsuccessful response')
            jobInfo.job.reject(error)
            this.onFailure(executionTime)
          }
          
          // Return worker to idle state
          this.currentJobMap.delete(worker)
          this.returnWorkerToIdle(worker)
          this.manageIdleWorkers()
          this.onSchedule()
        }
      }

      worker.onerror = (errorEvent) => {
        const jobInfo = this.currentJobMap.get(worker)
        if (jobInfo) {
          jobInfo.job.reject(new WorkerExecutionError(`Worker error: ${errorEvent}`, errorEvent))
        }
        
        this.currentJobMap.delete(worker)
        this.onFailure(0)
        this.errorHandler?.(new WorkerExecutionError(`Worker error: ${errorEvent}`, errorEvent))
        this.removeWorker(worker)
        this.onSchedule()
      }

      this.idleWorkers.push(entry)
      return entry
    } catch (error) {
      throw new WorkerSpawnError(`Failed to spawn worker: ${error}`, error)
    }
  }

  /**
   * Removes a worker from the pool and terminates it
   */
  removeWorker(worker: Worker): boolean {
    const removeFromArray = (arr: WorkerEntry[]): boolean => {
      const index = arr.findIndex(entry => entry.worker === worker)
      if (index >= 0) {
        const entry = arr[index]
        this.clearIdleTimer(entry)
        try {
          entry.worker.terminate()
        } catch (error) {
          console.warn(`Failed to terminate worker ${entry.id}:`, error)
        }
        arr.splice(index, 1)
        return true
      }
      return false
    }

    this.currentJobMap.delete(worker)
    return removeFromArray(this.idleWorkers) || removeFromArray(this.busyWorkers)
  }

  /**
   * Gets an idle worker and moves it to busy state
   */
  getIdleWorker(): WorkerEntry | null {
    const entry = this.idleWorkers.shift()
    if (entry) {
      this.clearIdleTimer(entry)
      this.busyWorkers.push(entry)
      return entry
    }
    return null
  }

  /**
   * Returns a worker to idle state from busy state
   */
  returnWorkerToIdle(worker: Worker): void {
    const busyIndex = this.busyWorkers.findIndex(e => e.worker === worker)
    if (busyIndex >= 0) {
      const entry = this.busyWorkers[busyIndex]
      this.busyWorkers.splice(busyIndex, 1)
      this.idleWorkers.push(entry)
    }
  }


  /**
   * Assigns a job to a worker
   */
  assignJob(entry: WorkerEntry, job: Job<TIn, TOut>): void {
    this.currentJobMap.set(entry.worker, { job, startTime: new Date() })
    try {
      entry.worker.postMessage(job.data)
    } catch (error) {
      this.currentJobMap.delete(entry.worker)
      throw new WorkerExecutionError(`Failed to post message to worker: ${error}`, error)
    }
  }

  /**
   * Manages idle worker retention based on min concurrency
   */
  manageIdleWorkers(): void {
    const surplusCount = Math.max(0, this.idleWorkers.length - this.minConcurrency)
    let processed = 0

    for (const entry of this.idleWorkers) {
      if (processed >= surplusCount) break
      
      if (!entry.timer) {
        entry.timer = setTimeout(() => {
          if (this.idleWorkers.length > this.minConcurrency) {
            this.removeWorker(entry.worker)
          } else {
            this.clearIdleTimer(entry)
          }
        }, this.idleTimeoutMs)
      }
      processed++
    }
  }

  private clearIdleTimer(entry: WorkerEntry): void {
    if (entry.timer) {
      clearTimeout(entry.timer)
      entry.timer = undefined
    }
  }

  get idleCount(): number { return this.idleWorkers.length }
  get busyCount(): number { return this.busyWorkers.length }
  get workerCount(): number { return this.idleWorkers.length + this.busyWorkers.length }

  /**
   * Terminates all workers and clears state
   */
  shutdown(): void {
    for (const entry of [...this.idleWorkers, ...this.busyWorkers]) {
      this.clearIdleTimer(entry)
      try {
        entry.worker.terminate()
      } catch (error) {
        console.warn(`Failed to terminate worker ${entry.id}:`, error)
      }
    }
    this.idleWorkers = []
    this.busyWorkers = []
    this.currentJobMap.clear()
  }
}

/**
 * Manages job queuing and scheduling
 */
class JobScheduler<TIn extends object, TOut extends object> {
  private queue: Job<TIn, TOut>[] = []

  /**
   * Adds a job to the queue
   */
  enqueue(job: Job<TIn, TOut>): void {
    this.queue.push(job)
  }

  /**
   * Removes and returns the next job from the queue
   */
  dequeue(): Job<TIn, TOut> | undefined {
    return this.queue.shift()
  }

  /**
   * Returns the number of queued jobs
   */
  get queuedCount(): number {
    return this.queue.length
  }

  /**
   * Clears all queued jobs
   */
  clear(): void {
    this.queue.splice(0)
  }

  /**
   * Returns true if there are jobs waiting to be processed
   */
  hasJobs(): boolean {
    return this.queue.length > 0
  }
}

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
      name
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
      this.errorHandler
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
