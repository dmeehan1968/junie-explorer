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
  readonly tasks: Map<string, Task> = new Map()
  readonly metrics: SummaryMetrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0 }

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

    const root = path.join(this.logPath, '..', path.parse(this.logPath).name, 'task-*.json')
    fs.globSync(root)
      .map(path => new Task(path))
      .forEach(task => this.tasks.set(task.id, task))

    for (const task of this.tasks.values()) {
      this.metrics.inputTokens += task.metrics.inputTokens
      this.metrics.outputTokens += task.metrics.outputTokens
      this.metrics.cacheTokens += task.metrics.cacheTokens
      this.metrics.cost += task.metrics.cost
      this.metrics.time += task.metrics.time
    }
  }

  getTaskById(id: string) {
    return this.tasks.get(`${this.id} ${id}`)
  }

  toJSON() {
    return {
      logPath: this.logPath,
      id: this.id,
      name: this.name,
      created: this.created,
      state: this.state,
      error: this.error,
      tasks: [...this.tasks],
      metrics: this.metrics,
    }
  }

  [inspect.custom]() {
    return this.toJSON()
  }
}