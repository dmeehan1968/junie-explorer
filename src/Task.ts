import fs from "fs-extra"
import path from "node:path"
import { inspect } from "node:util"
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
  private _trajectories: (Trajectory|TrajectoryError)[] = []

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
      // console.log(this.eventsFile, events.length, 'events')

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

    const root = this.eventsFile

    if (fs.existsSync(root)) {
      const content = await fs.promises.readFile(root, 'utf-8')
      const events = await Promise.all(content
        .split('\n')
        .filter(json => json.trim())
        .map((line, lineNumber) => {
          let json: any
          try {
            json = JSON.parse(line)
          } catch (error) {
            return {
              type: 'jsonError',
              timestamp: new Date(),
              event: {
                type: 'unparsed',
                data: line,
              },
            }
          }
          try {
            return EventRecord.parseAsync(json)
          } catch (error: any) {
            console.log(root, lineNumber, error.errors[0].code, error.errors[0].path, error.errors[0].message, line.slice(0, 100))
            return UnknownEventRecord.transform(record => ({ ...record, parseError: error })).parseAsync(json)
          }
        }))

        return events
          .filter((event): event is EventRecord => !!event)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    }

    return []
  }

  get events(): Promise<EventRecord[]> {
    if (this._events) {
      return this._events
    }

    this._events = new Promise(async (resolve) => {
      return resolve(await this.loadEvents())
    })

    return this._events
  }

  get eventTypes(): Promise<string[]> {
    return new Promise(async (resolve) => {
      const events = await this.events
      return resolve(events.map(e => e.event.type))
    })
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

  toJSON() {
    return {
      logPath: this.logPath,
      id: this.id,
      created: this.created,
      context: this.context,
      isDeclined: this.isDeclined,
      plan: this.plan,
      eventsFile: this.eventsFile,
      // events: [...this.events ?? []],
      trajectoriesFile: this.trajectoriesFile,
      trajectories: [...this.trajectories ?? []],
      steps: [...this.steps?.values() ?? []],
      metrics: this._metrics,
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
