import fs from "fs-extra"
import path from "path"
import { inspect } from "util"
import { z } from "zod"
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

export const Event = z.object({
  type: z.string(),
}).passthrough()
export type Event = z.infer<typeof Event>

export const EventRecord = z.object({
  event: Event,
  timestampMs: z.coerce.date(),
}).passthrough().transform(({ timestampMs, ...rest }) => ({ timestamp: timestampMs, ...rest }))
export type EventRecord = z.infer<typeof EventRecord>

export const SimpleError = z.object({
  type: z.literal('error'),
  message: z.string(),
  json: z.string(),
}).passthrough()
export type SimpleError = z.infer<typeof SimpleError>

export class Task {
  readonly id: string
  readonly created: Date
  readonly context: JunieTaskContext
  readonly isDeclined: boolean
  readonly plan: JuniePlan[]
  readonly steps: Map<number, Step> = new Map()
  readonly metrics: SummaryMetrics
  private _previousTasksInfo?: PreviousTasksInfo | null
  private _finalAgentState?: AgentState | null
  private _sessionHistory?: SessionHistory | null
  private _patch?: string | null
  private _events: (EventRecord|SimpleError)[] = []
  private _trajectory: any[] = []

  constructor(public readonly logPath: string) {
    const task = this.load()
    this.id = task.id
    this.created = task.created
    this.context = task.context
    this.isDeclined = task.isDeclined
    this.plan = task.plan

    const root = path.join(this.logPath, '../../..', this.id, 'step_+([0-9]).*{swe,chat}_next*')
    fs.globSync(root)
      .map(path => new Step(path))
      .sort((a, b) => a.id - b.id)
      .map(step => this.steps.set(step.id, step))

    this.metrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0 }
    for (const step of this.steps.values()) {
      this.metrics.inputTokens += step.metrics.inputTokens
      this.metrics.outputTokens += step.metrics.outputTokens
      this.metrics.cacheTokens += step.metrics.cacheTokens
      this.metrics.cost += step.metrics.cost + step.metrics.cachedCost
      this.metrics.time += step.metrics.modelTime
    }
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

  get events() {
    if (this._events.length > 0) {
      return this._events
    }

    const root = path.join(this.logPath, '../../../events', `${this.id}-events.jsonl`)

    if (fs.existsSync(root)) {
      const content = fs.readFileSync(root, 'utf-8')
      this._events = content
        .split('\n')
        .filter(json => json.trim())
        .map(json => {
          try {
            return EventRecord.parse(JSON.parse(json))
          } catch (error) {
            return {
              type: 'error',
              message: String(error),
              json,
            }
          }
        })
    }

    return this._events
  }

  get trajectory() {
    if (this._trajectory.length > 0) {
      return this._trajectory
    }

    const root = path.join(this.logPath, '../../../trajectory', `${this.id}.jsonl`)

    if (fs.existsSync(root)) {
      const content = fs.readFileSync(root, 'utf-8')
      this._trajectory = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line)
          } catch (error) {
            return {
              type: 'error',
              message: String(error),
              line,
            }
          }
        })
    }

    return this._trajectory
  }

  toJSON() {
    return {
      logPath: this.logPath,
      id: this.id,
      created: this.created,
      context: this.context,
      isDeclined: this.isDeclined,
      plan: this.plan,
      events: [...this.events ?? []],
      trajectory: [...this.trajectory ?? []],
      steps: [...this.steps?.values() ?? []],
      metrics: this.metrics,
      previousTasksInfo: this.previousTasksInfo,
      finalAgentState: this.finalAgentState,
      sessionHistory: this.sessionHistory,
      patch: this.patch,
    }
  }

  [inspect.custom]() {
    return this.toJSON()
  }
}
