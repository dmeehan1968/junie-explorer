import fs from "fs-extra"
import path from "path"
import { inspect } from "util"
import { JunieChainSchema, SummaryMetrics } from "./schema.js"
import { Task } from "./Task.js"

export class Issue {
  readonly id: string
  readonly name: string
  readonly created: Date
  readonly state: string
  readonly error?: any
  private readonly _tasks: Map<string, Task> = new Map()
  private _metrics?: SummaryMetrics

  constructor(public readonly logPath: string) {
    const issue = JunieChainSchema.safeParse(fs.readJsonSync(logPath))
    if (!issue.success) {
      throw new Error(`Error parsing JunieChain at ${logPath}: ${issue.error.message}`)
    }
    this.id = issue.data.id.id
    this.name = issue.data.name ?? '-No Name-'
    this.created = issue.data.created
    this.state = issue.data.state
    this.error = issue.data.error

  }

  get tasks() {
    if (this._tasks.size) {
      return this._tasks
    }

    const root = path.join(this.logPath, '..', path.parse(this.logPath).name, 'task-*.json')
    fs.globSync(root)
      .map(path => new Task(path))
      .sort((a, b) => a.created.getTime() - b.created.getTime())
      .forEach(task => this._tasks.set(task.id, task))

    return this._tasks
  }

  get metrics() {
    if (this._metrics) {
      return this._metrics
    }

    this._metrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0 }

    for (const task of this.tasks.values()) {
      this._metrics.inputTokens += task.metrics.inputTokens
      this._metrics.outputTokens += task.metrics.outputTokens
      this._metrics.cacheTokens += task.metrics.cacheTokens
      this._metrics.cost += task.metrics.cost
      this._metrics.time += task.metrics.time
    }

    return this._metrics
  }

  getTaskById(id: string) {
    return this._tasks.get(`${this.id} ${id}`)
  }

  toJSON() {
    return {
      logPath: this.logPath,
      id: this.id,
      name: this.name,
      created: this.created,
      state: this.state,
      error: this.error,
      tasks: [...this._tasks],
      metrics: this.metrics,
    }
  }

  [inspect.custom]() {
    return this.toJSON()
  }
}