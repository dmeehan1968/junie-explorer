import path from "node:path"

type Job<TIn, TOut> = {
  data: TIn
  resolve: (value: TOut) => void
  reject: (reason?: any) => void
}

interface WorkerPoolOptions {
  minConcurrency: number
  maxConcurrency: number
  workerPath: string
  idleTimeoutMs?: number
  errorHandler?: (e: any) => void
  name?: string
}

interface WorkerEntry {
  worker: Worker
  busy: boolean
  timer?: NodeJS.Timeout
  createdAt: Date
}

interface Success<T> {
  ok: true
  result: T
}

interface Failure {
  ok: false
  error: any
}

type Response<T> = Success<T> | Failure

export class WorkerPool<TIn extends object, TOut extends object> {
  private minConcurrency: number
  private maxConcurrency: number
  private workerPath: string
  private idleTimeoutMs: number
  private errorHandler?: (e: any) => void

  // optional human-friendly name for logging/metrics
  public readonly name: string

  private queue: Job<TIn, TOut>[] = []
  // Separate queues for round-robin management
  private idleWorkers: WorkerEntry[] = [] // head = 0 (shift), tail = push
  private busyWorkers: WorkerEntry[] = []

  // metrics
  public successCount = 0
  public failureCount = 0
  public get queuedCount() { return this.queue.length }
  public get busyCount() { return this.busyWorkers.length }
  public get idleCount() { return this.idleWorkers.length }
  public get workerCount() { return this.idleWorkers.length + this.busyWorkers.length }

  constructor(options: WorkerPoolOptions) {
    let { minConcurrency, maxConcurrency, workerPath, idleTimeoutMs, errorHandler, name } = options
    if (!Number.isFinite(minConcurrency) || minConcurrency < 0) minConcurrency = 0
    if (!Number.isFinite(maxConcurrency) || maxConcurrency < minConcurrency) maxConcurrency = minConcurrency
    maxConcurrency = Math.min(maxConcurrency, navigator.hardwareConcurrency)
    this.minConcurrency = minConcurrency
    this.maxConcurrency = maxConcurrency
    this.workerPath = workerPath
    this.idleTimeoutMs = idleTimeoutMs ?? 5000
    this.errorHandler = errorHandler
    // default name from provided name or worker file basename
    this.name = (() => {
      if (name && name.trim().length) return name.trim()
      try {
        return path.parse(workerPath).name
      } catch {
        return 'worker-pool'
      }
    })()

    // Pre-warm to min
    for (let i = 0; i < this.minConcurrency; i++) {
      this.spawnWorker()
    }
  }

  private spawnWorker() {
    const worker = new Worker(this.workerPath, { type: 'module' })
    const entry: WorkerEntry = { worker, busy: false, timer: undefined, createdAt: new Date() }

    // Route messages per job execution
    worker.onmessage = (event: MessageEvent<Response<TOut>>) => {
      const currentJob = this.currentJobMap.get(worker)
      if (!currentJob) return
      // Job completed on this worker
      entry.busy = false
      this.clearIdleTimer(entry)
      // Count completion and failures appropriately
      if (event.data && event.data.ok) {
        this.successCount++
        currentJob.resolve(event.data.result)
      } else {
        this.failureCount++
        currentJob.reject(event.data.error ?? new Error('Worker error'))
      }
      this.currentJobMap.delete(worker)
      // Move worker from busy -> idle (tail) for round-robin
      const idx = this.busyWorkers.findIndex(e => e.worker === worker)
      if (idx >= 0) this.busyWorkers.splice(idx, 1)
      this.idleWorkers.push(entry)
      this.schedule()
      this.ensureIdleRetention()
    }

    worker.onerror = (errorEvent) => {
      const currentJob = this.currentJobMap.get(worker)
      if (currentJob) {
        this.failureCount++
        currentJob.reject(errorEvent)
      }
      this.currentJobMap.delete(worker)
      this.errorHandler?.(errorEvent)
      // remove and respawn if needed
      this.removeWorker(worker)
      this.schedule()
    }

    // New worker starts idle at the tail for rotation
    this.idleWorkers.push(entry)
    return entry
  }

  private removeWorker(worker: Worker) {
    const removeFrom = (arr: WorkerEntry[]) => {
      const index = arr.findIndex(entry => entry.worker === worker)
      if (index >= 0) {
        const entry = arr[index]
        try { entry.worker.terminate() } catch {}
        arr.splice(index, 1)
        return true
      }
      return false
    }
    if (removeFrom(this.idleWorkers)) return
    if (removeFrom(this.busyWorkers)) return
  }

  private currentJobMap = new Map<Worker, Job<TIn, TOut>>()

  private postJobToWorkerEntry(entry: WorkerEntry, job: Job<TIn, TOut>) {
    entry.busy = true
    this.currentJobMap.set(entry.worker, job)
    try {
      entry.worker.postMessage(job.data)
    } catch (error) {
      entry.busy = false
      this.currentJobMap.delete(entry.worker)
      // Remove from busy queue if present and return to idle tail to keep rotation consistent
      const idx = this.busyWorkers.findIndex(e => e.worker === entry.worker)
      if (idx >= 0) this.busyWorkers.splice(idx, 1)
      this.idleWorkers.push(entry)
      // count as failed completion
      this.failureCount++
      job.reject(error)
    }
  }

  private schedule() {
    // Assign jobs to idle workers in round-robin (head -> tail)
    while (this.queue.length && this.idleWorkers.length > 0) {
      const entry = this.idleWorkers.shift()!
      const job = this.queue.shift()!
      // Move worker to busy queue tail
      this.clearIdleTimer(entry)
      this.busyWorkers.push(entry)
      this.postJobToWorkerEntry(entry, job)
    }

    // If queue remains and we can grow, spawn more
    while (this.queuedCount && this.workerCount < this.maxConcurrency) {
      this.spawnWorker()
      if (this.idleWorkers.length === 0) break
      const entry = this.idleWorkers.shift()!
      const job = this.queue.shift()!
      this.busyWorkers.push(entry)
      this.postJobToWorkerEntry(entry, job)
    }

    // Start idle timers for idle workers beyond min
    this.ensureIdleRetention()
  }

  private clearIdleTimer(entry: { timer?: NodeJS.Timeout }) {
    if (entry.timer) {
      clearTimeout(entry.timer)
      entry.timer = undefined
    }
  }

  private ensureIdleRetention() {
    const idleEntries = this.idleWorkers
    let surplusIdleCount = Math.max(0, idleEntries.length - this.minConcurrency)
    for (const entry of idleEntries) {
      if (surplusIdleCount <= 0) break
      if (!entry.timer) {
        entry.timer = setTimeout(() => {
          // Terminate if still idle and we have more than min
          if (!entry.busy && this.idleCount > this.minConcurrency) {
            this.removeWorker(entry.worker)
          } else {
            this.clearIdleTimer(entry)
          }
        }, this.idleTimeoutMs)
      }
      surplusIdleCount--
    }
  }

  public execute(data: TIn): Promise<TOut> {
    return new Promise<TOut>((resolve, reject) => {
      const job: Job<TIn, TOut> = { data, resolve, reject }
      this.queue.push(job)
      this.schedule()
    })
  }

  public shutdown() {
    for (const entry of this.idleWorkers) {
      try { entry.worker.terminate() } catch {}
    }
    for (const entry of this.busyWorkers) {
      try { entry.worker.terminate() } catch {}
    }
    this.idleWorkers = []
    this.busyWorkers = []
    this.queue.splice(0)
    this.currentJobMap.clear()
  }
}
