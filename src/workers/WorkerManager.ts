import { Job } from "./Job.js"
import { Failure, Response } from "./Response.js"
import { WorkerEntry } from "./WorkerEntry.js"
import { WorkerExecutionError } from "./WorkerExecutionError.js"
import { WorkerPoolError } from "./WorkerPoolError.js"
import { WorkerSpawnError } from "./WorkerSpawnError.js"

/**
 * Manages worker lifecycle and state
 */
export class WorkerManager<TIn extends object, TOut extends object> {
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
    private errorHandler?: (e: WorkerPoolError) => void,
  ) {
  }

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
        id: `worker-${++this.workerIdCounter}`,
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

  get idleCount(): number {
    return this.idleWorkers.length
  }

  get busyCount(): number {
    return this.busyWorkers.length
  }

  get workerCount(): number {
    return this.idleWorkers.length + this.busyWorkers.length
  }

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