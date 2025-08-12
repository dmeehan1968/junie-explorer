import fs from "fs-extra"
import path from "node:path"
import { AbstractPool, DynamicThreadPool, FixedThreadPool, ThreadPoolOptions } from "poolifier-web-worker"
import { getMaxConcurrency } from "./getMaxConcurrency.js"
import {
  AgentState,
  JuniePlan,
  JunieTaskContext,
  JunieTaskSchema,
  PreviousTasksInfo,
  SessionHistory,
  SummaryMetrics,
} from "./schema.js"
import { AutoSelectedLlm } from "./schema/AutoSelectedLlm.js"
import { EventRecord } from "./schema/eventRecord.js"
import { Event } from "./schema/event.js"
import { LlmResponseEvent } from "./schema/llmResponseEvent.js"
import { Step } from "./Step.js"
import { loadEvents } from "./workers/loadEvents.js"

export class Task {
  public id: string = ''
  public index: number = 0
  public created: Date = new Date()
  public context: JunieTaskContext = { description: '' }
  public isDeclined: boolean = false
  public plan: JuniePlan[] = []
  readonly _steps: Map<number, Step> = new Map()
  private _metrics: Promise<SummaryMetrics> | undefined = undefined
  private _previousTasksInfo?: PreviousTasksInfo | null
  private _finalAgentState?: AgentState | null
  private _sessionHistory?: SessionHistory | null
  private _patch?: string | null
  private _events: Promise<EventRecord[]> | undefined = undefined
  private _eventTypes: Promise<string[]> | undefined = undefined

  // Static worker pool for loading events
  private static _workerPool: AbstractPool<Worker, { eventsFilePath: string }, {
    events: EventRecord[]
  }> | null | undefined = undefined

  private static get workerPool() {
    const concurrency = getMaxConcurrency()
    if (this._workerPool) {
      return this._workerPool
    }

    if (this._workerPool === undefined) {
      if (concurrency > 0) {
        const workerPath = './src/workers/loadEventsWorker.ts'
        const isDynamic = concurrency > 1
        const options: ThreadPoolOptions = {
          errorEventHandler: (e) => {
            console.error('Worker pool error:', e)
          },
        }
        console.log(`Concurrency is ${concurrency}. Set environment CONCURRENCY to configure`)
        this._workerPool = isDynamic
          ? new DynamicThreadPool(1, concurrency, workerPath, options)
          : new FixedThreadPool(concurrency, workerPath, options)

        // Task stealing causes problems on reload (slow or fails to complete) and barely makes a difference
        // to performance as its only helpful as workers become idle
        this._workerPool.enableTasksQueue(true, { taskStealing: false, tasksStealingOnBackPressure: false })
      } else {
        this._workerPool = null
        console.warn(`Concurrency disabled. Set environment CONCURRENCY > 0 to enable`)
      }
    }
    return this._workerPool
  }

  constructor(public readonly logPath: string) {
    this.init()
  }

  private init() {
    const task = this.load()
    this.id = task.id
    this.index = task.index
    this.created = task.created
    this.context = task.context
    this.isDeclined = task.isDeclined
    this.plan = task.plan
  }

  reload() {
    this._metrics = undefined
    this._previousTasksInfo = undefined
    this._finalAgentState = undefined
    this._sessionHistory = undefined
    this._patch = undefined
    this._events = undefined
    this._eventTypes = undefined
    this._steps.clear()
    this.init()
  }

  get metrics(): Promise<SummaryMetrics> {
    this._metrics ??= new Promise(async (resolve) => {

      const metrics: SummaryMetrics = {
        inputTokens: 0,
        outputTokens: 0,
        cacheTokens: 0,
        cost: 0,
        time: 0,
        metricCount: 0,
      }

      // metrics needs to load events, but not retain them
      // but if metrics are already loaded (retained), then just use them
      // avoid using the events getter so we can discard them

      const events = this._events ? await this._events : await this.loadEvents()

      for (const event of events) {
        if (event.event.type === 'LlmResponseEvent') {
          metrics.cost += event.event.answer.cost
          metrics.inputTokens += event.event.answer.inputTokens
          metrics.outputTokens += event.event.answer.outputTokens
          metrics.cacheTokens += event.event.answer.cacheCreateInputTokens
          metrics.time += event.event.answer.time
          metrics.metricCount += event.event.answer.metricCount
        }
      }

      if (!this._events) {
        events.splice(0)
      }

      return resolve(metrics)

    })

    return this._metrics
  }

  get steps() {
    if (this._steps.size) {
      return this._steps
    }

    const stepPath = path.resolve(this.logPath, '../../..', this.id)
    if (!fs.existsSync(stepPath)) {
      return this._steps
    }

    const steps = fs.readdirSync(stepPath, { withFileTypes: true })
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

  private async loadEvents() {
    let events: EventRecord[] = []

    try {
      if (Task.workerPool) {
        const result = await Task.workerPool.execute({
          eventsFilePath: this.eventsFile,
        })
        events = result.events
      } else {
        events = (await loadEvents(this.eventsFile)).events
      }
    } catch (error) {
      console.error('Error loading events with worker pool:', error)
      // Fallback to original implementation if worker fails
      if (Task.workerPool) {
        events = (await loadEvents(this.eventsFile)).events
      }
    }

    const isGpt5AssistantEvent = (event: Event): event is LlmResponseEvent => event.type === LlmResponseEvent.shape.type.value && !event.answer.llm.isSummarizer && AutoSelectedLlm.shape.jbai.options.includes(event.answer.llm.jbai as never)
    const adjustedEvents = events.map((record, index) => {
      // GPT-5 cacheCreateInputTokens is not provided needs to be calculated, so that its the difference
      // in cacheInputTokens since the previous event.  However, its not consistent and sometimes gives a lower
      // figure, and then pops back up to roughly where it should be on the next event.
      if (isGpt5AssistantEvent(record.event)) {
        // find the previous response event of the same time
        const previousEvent = events
          .slice(0, index)
          .reverse()    // in-place, but the slice has created a copy so no unintended side effect
          .find(previous => isGpt5AssistantEvent(previous.event))

        if (previousEvent && previousEvent.event.type === LlmResponseEvent.shape.type.value) {
          // next line is a bit of a kludge so we can use cacheCreateInputTokens in the same way as Sonnet and still get
          // them costed correctly.
          record.event.answer.llm.cacheCreateInputPrice = record.event.answer.llm.cacheInputPrice
          record.event.answer.cacheCreateInputTokens = Math.max(0, (record.event.answer.cacheInputTokens ?? 0) - (previousEvent.event.answer.cacheInputTokens ?? 0))
        } else {
          record.event.answer.cacheCreateInputTokens = record.event.answer.cacheInputTokens
        }
      }
      return record
    })

    // Even then, there's an anomaly on the last event that would turn it negative and is likely a total of input
    // tokens for the session.
    const lastResponse = [...adjustedEvents]      // shallow copy
      .reverse()                                  // in place on shallow copy
      .find(record => isGpt5AssistantEvent(record.event))
    if (lastResponse) {
      if (lastResponse.event.type === LlmResponseEvent.shape.type.value) {
        lastResponse.event.answer.inputTokens = 0
      }
    }

    return adjustedEvents
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

}
