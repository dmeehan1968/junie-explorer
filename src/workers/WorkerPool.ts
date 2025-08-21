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
}

export class WorkerPool<TIn extends object, TOut extends object> {
  private minConcurrency: number
  private maxConcurrency: number
  private workerPath: string
  private idleTimeoutMs: number
  private errorHandler?: (e: any) => void

  // optional human-friendly name for logging/metrics
  public readonly name: string

  private queue: Job<TIn, TOut>[] = []
  private workers: WorkerEntry[] = []

  // metrics
  public executionsCount = 0
  public failedCount = 0
  public get queuedCount() { return this.queue.length }
  public get idleCount() { return this.workers.filter(w => !w.busy).length }
  public get executingCount() { return this.workers.filter(w => w.busy).length }

  constructor(options: WorkerPoolOptions) {
    let { minConcurrency, maxConcurrency, workerPath, idleTimeoutMs, errorHandler, name } = options
    if (!Number.isFinite(minConcurrency) || minConcurrency < 1) minConcurrency = 1
    if (!Number.isFinite(maxConcurrency) || maxConcurrency < minConcurrency) maxConcurrency = minConcurrency
    maxConcurrency = Math.min(maxConcurrency, navigator.hardwareConcurrency)
    this.minConcurrency = minConcurrency
    this.maxConcurrency = maxConcurrency
    this.workerPath = workerPath
    this.idleTimeoutMs = idleTimeoutMs ?? 5000
    this.errorHandler = errorHandler
    // default name from provided name or worker file basename
    const derivedName = (() => {
      if (name && name.trim().length) return name.trim()
      try {
        // workerPath might be relative; take last segment
        const parts = workerPath.split(/[\\\/]/)
        const base = parts[parts.length - 1] || workerPath
        return base.replace(/\.[cm]?tsx?$/i, '')
      } catch {
        return 'worker-pool'
      }
    })()
    this.name = derivedName

    // Pre-warm to min
    for (let i = 0; i < this.minConcurrency; i++) {
      this.spawnWorker()
    }
  }

  private spawnWorker() {
    const worker = new Worker(this.workerPath, { type: 'module' })
    const entry: WorkerEntry = { worker, busy: false, timer: undefined }

    // Route messages per job execution
    worker.onmessage = (event: MessageEvent) => {
      // The worker replies with { ok, result?, error? }
      const currentJob = this.currentJobMap.get(worker)
      if (!currentJob) return
      entry.busy = false
      this.clearIdleTimer(entry)
      // Count completion and failures appropriately
      this.executionsCount++
      if (event.data && event.data.ok) {
        currentJob.resolve(event.data.result as TOut)
      } else {
        this.failedCount++
        currentJob.reject(event.data?.error ?? new Error('Worker error'))
      }
      this.currentJobMap.delete(worker)
      this.schedule()
      this.ensureIdleRetention()
    }

    worker.onerror = (errorEvent) => {
      const currentJob = this.currentJobMap.get(worker)
      if (currentJob) {
        this.failedCount++
        this.executionsCount++
        currentJob.reject(errorEvent)
      }
      this.currentJobMap.delete(worker)
      this.errorHandler?.(errorEvent)
      // remove and respawn if needed
      this.removeWorker(worker)
      this.schedule()
    }

    this.workers.push(entry)
    return entry
  }

  private removeWorker(worker: Worker) {
    const index = this.workers.findIndex(entry => entry.worker === worker)
    if (index >= 0) {
      try { this.workers[index].worker.terminate() } catch {}
      this.workers.splice(index, 1)
    }
  }

  private currentJobMap = new Map<Worker, Job<TIn, TOut>>()

  private postJobToEntry(entry: WorkerEntry, job: Job<TIn, TOut>) {
    entry.busy = true
    this.currentJobMap.set(entry.worker, job)
    try {
      entry.worker.postMessage(job.data)
    } catch (error) {
      entry.busy = false
      this.currentJobMap.delete(entry.worker)
      // count as failed completion
      this.failedCount++
      this.executionsCount++
      job.reject(error)
    }
  }

  private schedule() {
    // Fill available workers with queued jobs
    for (const entry of this.workers) {
      if (!this.queuedCount) break
      if (entry.busy) continue
      const job = this.queue.shift()!
      this.postJobToEntry(entry, job)
    }

    // If queue remains and we can grow, spawn more
    while (this.queuedCount && this.workers.length < this.maxConcurrency) {
      const entry = this.spawnWorker()
      const job = this.queue.shift()!
      this.postJobToEntry(entry, job)
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
    const idleEntries = this.workers.filter(entry => !entry.busy)
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
    for (const entry of this.workers) {
      try { entry.worker.terminate() } catch {}
    }
    this.workers = []
    this.queue.splice(0)
    this.currentJobMap.clear()
  }
}
