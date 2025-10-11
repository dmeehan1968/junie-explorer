import fs from "fs-extra"
import path from "node:path"
import { inspect } from "node:util"
import { JunieChainSchema, SummaryMetrics } from "./schema.js"
import { Task } from "./Task.js"

export class Issue {
  public id: string = ''
  public name: string = ''
  public created: Date = new Date()
  public state: string = ''
  public error?: any
  private _tasks: Promise<Map<string, Task>> | undefined = undefined
  private _metrics: Promise<SummaryMetrics> | undefined = undefined

  constructor(public readonly logPath: string) {
    this.init()

  }

  private init() {
    const issue = JunieChainSchema.safeParse(fs.readJsonSync(this.logPath))
    if (!issue.success) {
      throw new Error(`Error parsing JunieChain at ${this.logPath}: ${issue.error.message}`)
    }
    this.id = issue.data.id.id
    this.name = issue.data.name ?? '-No Name-'
    this.created = issue.data.created
    this.state = issue.data.state
    this.error = issue.data.error
  }

  reload() {
    this._tasks = undefined
    this._metrics = undefined
    this.init()
  }

  get tasks(): Promise<Map<string, Task>> {
    this._tasks ??= new Promise(async (resolve) => {

      const tasks = new Map<string, Task>()

      const taskPath = path.join(this.logPath, '..', path.parse(this.logPath).name)

      if (fs.existsSync(taskPath)) {
        fs.globSync(path.join(taskPath, 'task-*.json'))
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

      const metrics: SummaryMetrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0, metricCount: 0, webSearchCount: 0 }

      for (const [_, task] of await this.tasks) {
        const taskMetrics = await task.metrics
        metrics.inputTokens += taskMetrics.inputTokens
        metrics.outputTokens += taskMetrics.outputTokens
        metrics.cacheTokens += taskMetrics.cacheTokens
        metrics.webSearchCount += taskMetrics.webSearchCount
        metrics.cost += taskMetrics.cost
        metrics.time += taskMetrics.time
        metrics.metricCount += taskMetrics.metricCount
      }

      resolve(metrics)

    })

    return this._metrics
  }

  async getTaskById(id: string) {
    return (await this.tasks).get(`${this.id} ${id}`)
  }

  // Recalculate assistant providers across all tasks each time accessed
  get assistantProviders(): Promise<Set<{ provider: string; name?: string; jbai?: string }>> {
    return (async () => {
      const unique = new Map<string, { provider: string; name?: string; jbai?: string }>()
      const tasks = [...(await this.tasks).values()]
      await Promise.all(
        tasks.map(async (task) => {
          for (const p of task.assistantProviders) {
            const key = `${p.provider}|${p.name ?? ''}|${p.jbai ?? ''}`
            if (!unique.has(key)) {
              unique.set(key, p)
            }
          }
        })
      )
      return new Set(unique.values())
    })()
  }
}