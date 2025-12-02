import fs from "fs-extra"
import path from "node:path"
import publicFiles from "./bun/public"
import { getMaxConcurrency } from "./getMaxConcurrency"
import {
  addSummaryMetrics,
  AgentState,
  initialisedSummaryMetrics,
  JuniePlan,
  JunieTaskContext,
  JunieTaskSchema,
  PreviousTasksInfo,
  SessionHistory,
  SummaryMetrics,
} from "./schema.js"
import { AgentType } from "./schema/agentType"
import { Event } from "./schema/event"
import { EventRecord } from "./schema/eventRecord"
import { isRequestEvent, LlmRequestEvent } from "./schema/llmRequestEvent"
import { isResponseEvent, LlmResponseEvent } from "./schema/llmResponseEvent"
import { openAI5 } from "./schema/openAI5"
import { OpenAI51 } from "./schema/openAI51"
import { StatsCollector } from "./stats/StatsCollector"
import { Step } from "./Step"
import { loadEvents } from "./workers/loadEvents"
import { LoadEventsInput } from "./workers/loadEventsInput"
import { LoadEventsOutput } from "./workers/loadEventsOutput"
import { WorkerPool } from "./workers/WorkerPool"

export class Task {
  public id: string = ''
  public index: number = 0
  public created: Date = new Date()
  public context: JunieTaskContext = { description: '' }
  public isDeclined: boolean = false
  public plan: JuniePlan[] = []
  public assistantProviders: Set<{ provider: string; name?: string; jbai?: string }> = new Set()
  readonly _steps: Map<number, Step> = new Map()
  private _metrics: Promise<SummaryMetrics> | undefined = undefined
  private _previousTasksInfo?: PreviousTasksInfo | null
  private _finalAgentState?: AgentState | null
  private _sessionHistory?: SessionHistory | null
  private _patch?: string | null
  private _events: Promise<EventRecord[]> | undefined = undefined
  private _eventTypes: Promise<string[]> | undefined = undefined

  // Static worker pool for loading events
  private static _workerPool: WorkerPool<{ eventsFilePath: string }, {
    events: EventRecord[]
  }> | null | undefined = undefined
  private static _statsCollector: StatsCollector | null = null

  public static setStatsCollector(statsCollector: StatsCollector) {
    this._statsCollector = statsCollector
    // If worker pool already exists, register it
    if (this._workerPool) {
      statsCollector.registerWorkerPool(this._workerPool)
    }
  }

  private static get workerPool() {
    if (this._workerPool) {
      return this._workerPool
    }

    const maxConcurrency = getMaxConcurrency()

    if (this._workerPool === undefined) {
      if (maxConcurrency > 0) {
        const bundledWorker = publicFiles['loadEventsWorker.js']
        if (!bundledWorker) {
          throw new Error('Failed to load bundled loadEventsWorker.js from public folder')
        }
        const blob = new Blob([bundledWorker], { type: 'application/javascript' })
        const workerPath = URL.createObjectURL(blob)

        console.log(`Concurrency is ${maxConcurrency}. Set environment CONCURRENCY to configure`)
        this._workerPool = new WorkerPool<LoadEventsInput, LoadEventsOutput>({
          minConcurrency: 0,
          maxConcurrency: maxConcurrency,
          workerPath,
          idleTimeoutMs: 5000,
          errorHandler: (e) => console.error('Worker pool error:', e),
          onFileIOStats: (stats) => {
            if (this._statsCollector) {
              this._statsCollector.mergeWorkerFileIOStats(stats)
            }
          },
        })

        // Register with stats collector if available
        if (this._statsCollector) {
          this._statsCollector.registerWorkerPool(this._workerPool)
        }

      } else {
        this._workerPool = null
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
    this.assistantProviders.clear()
    this._steps.clear()
    this.init()
  }

  get metrics(): Promise<SummaryMetrics> {
    this._metrics ??= new Promise(async (resolve) => {

      const metrics: SummaryMetrics = initialisedSummaryMetrics()

      // metrics needs to load events, but not retain them
      // but if metrics are already loaded (retained), then just use them
      // avoid using the events getter so we can discard them

      const events = this._events ? await this._events : await this.loadEvents()

      for (const event of events) {
        if (event.event.type === 'LlmResponseEvent') {
          addSummaryMetrics(metrics, {
            cost: event.event.answer.cost,
            inputTokens: event.event.answer.inputTokens,
            inputTokenCost: event.event.answer.inputTokenCost,
            outputTokens: event.event.answer.outputTokens,
            outputTokenCost: event.event.answer.outputTokenCost,
            cacheTokens: event.event.answer.cacheCreateInputTokens,
            cacheTokenCost: event.event.answer.cacheCreateInputTokenCost,
            webSearchCount: event.event.answer.webSearchCount,
            webSearchCost: event.event.answer.webSearchCost,
            time: event.event.answer.time,
            metricCount: event.event.answer.metricCount,
          })
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

    // match LlmResponseEvent to their LlmRequestEvents
    for (let index=0 ; index < events.length ; index++) {
      const event = events[index].event
      if (event.type === 'LlmResponseEvent') {
        event.requestEvent = events.slice(0, index).reverse().find(previous => isRequestEvent(previous.event) && previous.event.id === event.id)?.event as LlmRequestEvent
      } else if (event.type === 'LlmRequestEvent') {
        event.previousRequest = events.slice(0, index).reverse().find(previous => isRequestEvent(previous.event) && previous.event.modelParameters.model.jbai === event.modelParameters.model.jbai)?.event as LlmRequestEvent
      }
    }

    const isGpt5ResponseEvent = (event: Event): event is LlmResponseEvent =>
      event.type === LlmResponseEvent.shape.type.value
      && [...openAI5.shape.jbai.options, OpenAI51.shape.jbai.value].includes(event.answer.llm.jbai as never)

    const adjustedEvents = events.map((record, index) => {
      // GPT-5 cacheCreateInputTokens is not provided needs to be calculated, so that its the difference
      // in cacheInputTokens since the previous event.  However, its not consistent and sometimes gives a lower
      // figure, and then pops back up to roughly where it should be on the next event.
      if (isGpt5ResponseEvent(record.event)) {
        // find the previous response event of the same time
        const previousEvent = events
          .slice(0, index)
          .reverse()    // in-place, but the slice has created a copy so no unintended side effect
          .find(previous =>   // find matching model request
            isResponseEvent(previous.event) && isResponseEvent(record.event) && previous.event.answer.llm.jbai === record.event.answer.llm.jbai)

        if (previousEvent && previousEvent.event.type === LlmResponseEvent.shape.type.value) {
          // next line is a bit of a kludge so we can use cacheCreateInputTokens in the same way as Sonnet and still get
          // them costed correctly.
          record.event.answer.cacheCreateInputTokens = Math.max(0, record.event.answer.cacheInputTokens - previousEvent.event.answer.cacheInputTokens - previousEvent.event.answer.cacheCreateInputTokens)
          record.event.answer.cacheInputTokens = Math.max(record.event.answer.cacheInputTokens - record.event.answer.cacheCreateInputTokens)
        } else {
          record.event.answer.cacheCreateInputTokens = record.event.answer.cacheInputTokens
          record.event.answer.cacheInputTokens = 0
        }
      }
      return record
    })

    // Even then, there's an anomaly on the last event that would turn it negative and is likely a total of input
    // tokens for the session.
    const lastResponse = [...adjustedEvents]      // shallow copy
      .reverse()                                  // in place on shallow copy
      .find(record => isGpt5ResponseEvent(record.event))
    if (lastResponse) {
      if (lastResponse.event.type === LlmResponseEvent.shape.type.value) {
        lastResponse.event.answer.inputTokens = 0
      }
    }

    // Rebuild providers set from non-summarizer LlmRequestEvent models
    {
      const unique = new Map<string, { provider: string; name?: string; jbai?: string }>()
      events
        .filter(r => r.event.type === LlmRequestEvent.shape.type.value)
        .map(r => r.event as LlmRequestEvent)
        .filter(e => e.chat.agentType === AgentType.enum.Agent)
        .forEach(e => {
          const provider = (e.modelParameters?.model as any)?.provider as string | undefined
          const name = (e.modelParameters?.model as any)?.name as string | undefined
          const jbai = (e.modelParameters?.model as any)?.jbai as string | undefined
          if (provider) {
            const key = `${provider}|${name ?? ''}|${jbai ?? ''}`
            if (!unique.has(key)) {
              unique.set(key, { provider, name, jbai })
            }
          }
        })
      this.assistantProviders = new Set(unique.values())
    }
    //
    // return adjustedEvents
    return events
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
