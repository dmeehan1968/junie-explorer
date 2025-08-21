type Job<TIn, TOut> = {
  data: TIn
  resolve: (value: TOut) => void
  reject: (reason?: any) => void
}

interface WorkerPoolOptions {
  idleTimeoutMs?: number
  errorHandler?: (e: any) => void
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

  private queue: Job<TIn, TOut>[] = []
  private workers: WorkerEntry[] = []

  // metrics
  public executionsCount = 0
  public failedCount = 0
  public get queuedCount() { return this.queue.length }
  public get idleCount() { return this.workers.filter(w => !w.busy).length }
  public get executingCount() { return this.workers.filter(w => w.busy).length }

  constructor(minConcurrency: number, maxConcurrency: number, workerPath: string, options: WorkerPoolOptions = {}) {
    if (!Number.isFinite(minConcurrency) || minConcurrency < 1) minConcurrency = 1
    if (!Number.isFinite(maxConcurrency) || maxConcurrency < minConcurrency) maxConcurrency = minConcurrency
    maxConcurrency = Math.min(maxConcurrency, navigator.hardwareConcurrency)
    this.minConcurrency = minConcurrency
    this.maxConcurrency = maxConcurrency
    this.workerPath = workerPath
    this.idleTimeoutMs = options.idleTimeoutMs ?? 5000
    this.errorHandler = options.errorHandler

    // Pre-warm to min
    for (let i = 0; i < this.minConcurrency; i++) {
      this.spawnWorker()
    }
  }

  private spawnWorker() {
    const w = new Worker(this.workerPath, { type: 'module' })
    const entry: WorkerEntry = { worker: w, busy: false, timer: undefined }

    // Route messages per job execution
    w.onmessage = (ev: MessageEvent) => {
      // The worker replies with { ok, result?, error? }
      const currentJob = this.currentJobMap.get(w)
      if (!currentJob) return
      entry.busy = false
      this.clearIdleTimer(entry)
      // Count completion and failures appropriately
      this.executionsCount++
      if (ev.data && ev.data.ok) {
        currentJob.resolve(ev.data.result as TOut)
      } else {
        this.failedCount++
        currentJob.reject(ev.data?.error ?? new Error('Worker error'))
      }
      this.currentJobMap.delete(w)
      this.schedule()
      this.ensureIdleRetention()
    }

    w.onerror = (e) => {
      const currentJob = this.currentJobMap.get(w)
      if (currentJob) {
        this.failedCount++
        this.executionsCount++
        currentJob.reject(e)
      }
      this.currentJobMap.delete(w)
      this.errorHandler?.(e)
      // remove and respawn if needed
      this.removeWorker(w)
      this.schedule()
    }

    this.workers.push(entry)
    return entry
  }

  private removeWorker(w: Worker) {
    const idx = this.workers.findIndex(we => we.worker === w)
    if (idx >= 0) {
      try { this.workers[idx].worker.terminate() } catch {}
      this.workers.splice(idx, 1)
    }
  }

  private currentJobMap = new Map<Worker, Job<TIn, TOut>>()

  private schedule() {
    // Fill available workers with queued jobs
    for (const entry of this.workers) {
      if (!this.queue.length) break
      if (entry.busy) continue
      const job = this.queue.shift()!
      entry.busy = true
      this.currentJobMap.set(entry.worker, job)
      try {
        entry.worker.postMessage(job.data)
      } catch (e) {
        entry.busy = false
        this.currentJobMap.delete(entry.worker)
        // count as failed completion
        this.failedCount++
        this.executionsCount++
        job.reject(e)
      }
    }

    // If queue remains and we can grow, spawn more
    while (this.queue.length && this.workers.length < this.maxConcurrency) {
      const entry = this.spawnWorker()
      const job = this.queue.shift()!
      entry.busy = true
      this.currentJobMap.set(entry.worker, job)
      try {
        entry.worker.postMessage(job.data)
      } catch (e) {
        entry.busy = false
        this.currentJobMap.delete(entry.worker)
        this.failedCount++
        this.executionsCount++
        job.reject(e)
      }
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
    let idle = this.workers.filter(w => !w.busy)
    const surplus = Math.max(0, idle.length - this.minConcurrency)
    // terminate surplus idles after timeout
    let toTerminate = surplus
    for (const entry of idle) {
      if (toTerminate <= 0) break
      if (!entry.timer) {
        entry.timer = setTimeout(() => {
          // Terminate if still idle and we have more than min
          if (!entry.busy && this.workers.filter(w => !w.busy).length > this.minConcurrency) {
            this.removeWorker(entry.worker)
          } else {
            this.clearIdleTimer(entry)
          }
        }, this.idleTimeoutMs)
      }
      toTerminate--
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
