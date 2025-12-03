import fs from "fs-extra"
import path from "node:path"
import { addSummaryMetrics, initialisedSummaryMetrics, JunieChainSchema, SummaryMetrics } from "./schema"
import { Task } from "./Task"

export class Issue {
  public id: string = ''
  public name: string = ''
  public created: Date = new Date()
  public state: string = ''
  public error?: any
  private _tasks: Promise<Map<string, Task>> | undefined = undefined
  private _metrics: Promise<SummaryMetrics> | undefined = undefined
  private _metricsByJbai: Promise<Record<string, SummaryMetrics>> | undefined = undefined

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
    this._metricsByJbai = undefined
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

      const metrics: SummaryMetrics = initialisedSummaryMetrics()

      for (const [_, task] of await this.tasks) {
        addSummaryMetrics(metrics, await task.metrics)
      }

      resolve(metrics)

    })

    return this._metrics
  }

  get metricsByJbai(): Promise<Record<string, SummaryMetrics>> {
    this._metricsByJbai ??= new Promise(async (resolve) => {
      const metricsByJbai: Record<string, SummaryMetrics> = {}
      for (const [_, task] of await this.tasks) {
        const taskMetricsByJbai = await task.metricsByJbai
        for (const [jbai, metrics] of Object.entries(taskMetricsByJbai)) {
          if (!metricsByJbai[jbai]) {
            metricsByJbai[jbai] = initialisedSummaryMetrics()
          }
          addSummaryMetrics(metricsByJbai[jbai], metrics)
        }
      }
      resolve(metricsByJbai)
    })
    return this._metricsByJbai
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