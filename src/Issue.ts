import fs from "fs-extra"
import path from "node:path"
import { inspect } from "node:util"
import { JunieChainSchema, SummaryMetrics } from "./schema.js"
import { Task } from "./Task.js"

export class Issue {
  readonly id: string
  readonly name: string
  readonly created: Date
  readonly state: string
  readonly error?: any
  private _tasks: Promise<Map<string, Task>> | undefined = undefined
  private _metrics: Promise<SummaryMetrics> | undefined = undefined

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

  get tasks(): Promise<Map<string, Task>> {
    this._tasks ??= new Promise(async (resolve) => {

      const tasks = new Map<string, Task>()

      const taskPath = path.join(this.logPath, '..', path.parse(this.logPath).name)

      if (fs.existsSync(taskPath)) {
        const root = path.join(taskPath, 'task-*.json')
        fs.globSync(root)
          .map(path => new Task(path))
          .sort((a, b) => a.created.getTime() - b.created.getTime())
          .forEach(task => tasks.set(task.id, task))
      }

      resolve(tasks)

    })

    return this._tasks
  }

  get metrics(): Promise<SummaryMetrics> {
    this._metrics ??= new Promise(async (resolve) => {

      const metrics: SummaryMetrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0, metricCount: 0 }

      const tasks = [...(await this.tasks).values()]
      await Promise.all(tasks.map(async (task) => {
        const taskMetrics = await task.metrics
        metrics.inputTokens += taskMetrics.inputTokens
        metrics.outputTokens += taskMetrics.outputTokens
        metrics.cacheTokens += taskMetrics.cacheTokens
        metrics.cost += taskMetrics.cost
        metrics.time += taskMetrics.time
        metrics.metricCount += taskMetrics.metricCount
      }))

      resolve(metrics)

    })

    return this._metrics
  }

  async getTaskById(id: string) {
    return (await this.tasks).get(`${this.id} ${id}`)
  }

}