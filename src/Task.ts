import fs from "fs-extra"
import path from "node:path"
import {
  AbstractPool,
  availableParallelism,
  DynamicThreadPool,
  FixedThreadPool,
  ThreadPoolOptions,
} from "poolifier-web-worker"
import { EventRecord, UnknownEventRecord } from "./eventSchema.js"
import {
  AgentState,
  JuniePlan,
  JunieTaskContext,
  JunieTaskSchema,
  PreviousTasksInfo,
  SessionHistory,
  SummaryMetrics,
} from "./schema.js"
import { Step } from "./Step.js"
import { Trajectory, TrajectoryError } from "./trajectorySchema.js"
import { loadEvents } from "./workers/loadEvents.js"

export class Task {
  readonly id: string
  readonly created: Date
  readonly context: JunieTaskContext
  readonly isDeclined: boolean
  readonly plan: JuniePlan[]
  readonly _steps: Map<number, Step> = new Map()
  private _metrics: Promise<SummaryMetrics> | undefined = undefined
  private _previousTasksInfo?: PreviousTasksInfo | null
  private _finalAgentState?: AgentState | null
  private _sessionHistory?: SessionHistory | null
  private _patch?: string | null
  private _events: Promise<EventRecord[]> | undefined = undefined
  private _eventTypes: Promise<string[]> | undefined = undefined
  private _trajectories: (Trajectory | TrajectoryError)[] = []

  // Static worker pool for loading events
  private static _workerPool: AbstractPool<Worker, { eventsFilePath: string }, { events: EventRecord[] }> | null | undefined = undefined

  private static get workerPool() {
    const maxParallelism = Math.min(availableParallelism(), parseInt(process.env.MAX_WORKERS ?? availableParallelism().toString()))
    if (this._workerPool) {
      return this._workerPool
    }

    if (this._workerPool === undefined) {
      if (maxParallelism > 0) {
        const workerPath = './src/workers/loadEventsWorker.ts'
        const isDynamic = maxParallelism > 1
        const options: ThreadPoolOptions = {
          errorEventHandler: (e) => {
            console.error('Worker pool error:', e)
          },
        }
        console.log(`Concurrency is ${maxParallelism}. Set MAX_WORKERS to configure`)
        this._workerPool = isDynamic
          ? new DynamicThreadPool(1, maxParallelism, workerPath, options)
          : new FixedThreadPool(maxParallelism, workerPath, options)
      } else {
        this._workerPool = null
        console.warn(`Concurrency disabled. Set MAX_WORKERS to enable`)
      }
    }
    return this._workerPool
  }

  constructor(public readonly logPath: string) {
    const task = this.load()
    this.id = task.id
    this.created = task.created
    this.context = task.context
    this.isDeclined = task.isDeclined
    this.plan = task.plan
  }

  get metrics(): Promise<SummaryMetrics> {
    if (this._metrics) {
      return this._metrics
    }

    this._metrics = new Promise(async (resolve) => {

      const metrics: SummaryMetrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0 }

      // metrics needs to load events, but not retain them
      // but if metrics are already loaded (retained), then just use them
      // avoid events getter so we can discard them
      const events = this._events ? await this._events : await this.loadEvents()

      for (const event of events) {
        if (event.event.type === 'LlmResponseEvent') {
          metrics.cost += event.event.answer.cost
          metrics.inputTokens += event.event.answer.inputTokens
          metrics.outputTokens += event.event.answer.outputTokens
          metrics.cacheTokens += event.event.answer.cacheCreateInputTokens
          metrics.time += event.event.answer.time ?? 0
        }
      }

      if (!this._events) {
        events.splice(0)
      }

      return resolve(metrics)

    })

    return this._metrics!
  }

  get steps() {
    if (this._steps.size) {
      return this._steps
    }

    const steps = fs.readdirSync(path.resolve(this.logPath, '../../..', this.id), { withFileTypes: true })
      .filter(file => file.isFile() && /^step_[0-9]+\.((.*(swe|chat)_next.*)|(junie_single_step_(chat|issue)))$/.test(file.name))
      .sort((a, b) => a.name.localeCompare(b.name))

    steps
      .map(file => new Step(path.join(file.parentPath, file.name)))
      .sort((a, b) => a.id - b.id)
      .map(step => this._steps.set(step.id, step))

    return this._steps
  }

  getStepById(id: number) {
    return this.steps.get(id)
  }

  private load() {
    const task = JunieTaskSchema.safeParse(fs.readJsonSync(this.logPath))

    if (!task.success) {
      throw new Error(`Error parsing JunieTask at ${this.logPath}: ${task.error.message}`)
    }

    return task.data
  }

  private lazyload() {
    if (this._previousTasksInfo === undefined || this._finalAgentState === undefined && this._sessionHistory === undefined && this._patch === undefined) {
      const task = this.load()
      this._previousTasksInfo = task.previousTasksInfo
      this._finalAgentState = task.finalAgentState
      this._sessionHistory = task.sessionHistory
      this._patch = task.patch
    }
    return this
  }

  get previousTasksInfo() {
    return this.lazyload()._previousTasksInfo!
  }

  get finalAgentState() {
    return this.lazyload()._finalAgentState!
  }

  get sessionHistory() {
    return this.lazyload()._sessionHistory!
  }

  get patch() {
    return this.lazyload()._patch!
  }

  get eventsFile() {
    return path.join(this.logPath, '../../../events', `${this.id}-events.jsonl`)
  }

  private async loadEvents(): Promise<EventRecord[]> {
    try {
      if (Task.workerPool) {
        const result = await Task.workerPool.execute({
          eventsFilePath: this.eventsFile,
        })
        return result.events
      }
      return loadEvents(this.eventsFile).events
    } catch (error) {
      console.error('Error loading events with worker pool:', error)
      // Fallback to original implementation if worker fails
      return loadEvents(this.eventsFile).events
    }
  }

  get events(): Promise<EventRecord[]> {
    this._events ??= this.loadEvents()
    return this._events
  }

  get eventTypes(): Promise<string[]> {
    this._eventTypes ??= new Promise(async (resolve) => {
      const eventTypes = [...new Set((await this.events).map(e => e.event.type))].sort()
      return resolve(eventTypes)
    })
    return this._eventTypes
  }

  get trajectoriesFile() {
    return path.join(this.logPath, '../../../trajectory', `${this.id}.jsonl`)
  }

  get trajectories() {
    if (this._trajectories.length > 0) {
      return this._trajectories
    }

    const root = this.trajectoriesFile

    if (fs.existsSync(root)) {
      const content = fs.readFileSync(root, 'utf-8')
      this._trajectories = content
        .split('\n')
        .filter(line => line.trim())
        .map((line, index) => {
          try {
            return Trajectory.parse(JSON.parse(line))
          } catch (error) {
            console.error(`Trajectory error in ${root}:${index}`, error)
            return TrajectoryError.parse({ error, line })
          }
        })
    }

    return this._trajectories
  }
}
