import fs from "fs-extra"
import path from "node:path"
import { addSummaryMetrics, initialisedSummaryMetrics, JunieChainSchema, SummaryMetrics } from "./schema"
import { Task } from "./Task"

export class Issue {
  public readonly logPath: string | undefined
  public readonly taskPath: string | undefined
  public id: string = ''
  public name: string = ''
  public created: Date = new Date()
  public state: string = ''
  public error?: any
  public readonly isAIA: boolean = false
  private _tasks: Promise<Map<string, Task>> | undefined = undefined
  private _metrics: Promise<SummaryMetrics> | undefined = undefined
  private _metricsByModel: Promise<Record<string, SummaryMetrics>> | undefined = undefined

  constructor(logPath: string)
  constructor(id: string, created: Date, task: Task)

  constructor(logPathOrId: string, created?: Date, task?: Task) {
    if (created && task) {
      this.isAIA = true
      this.id = this.name = logPathOrId
      this.created = created
      this.state = 'Running'
      this._tasks = Promise.resolve(new Map([[this.id + ' 0', task]]))
      void new Promise(async resolve => {
        const records = await task.loadEvents() // load events without caching
        records.forEach(record => {
          if (record.event.type === 'TaskSummaryCreatedEvent') {
            this.name = record.event.taskSummary
          } else if (record.event.type === 'TaskResultCreatedEvent') {
            this.state = record.event.taskResult.state.isFinished ? 'Finished' : 'Stopped'
          }
        })
        resolve(undefined)
      })
    } else {
      this.logPath = logPathOrId
      this.taskPath = path.join(this.logPath, '..', path.parse(this.logPath).name)
      this.init()
    }
  }

  private init() {
    if (!this.logPath) {
      return
    }
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
    this._metricsByModel = undefined
    this.init()
  }

  get tasks(): Promise<Map<string, Task>> {
    this._tasks ??= new Promise(async (resolve) => {

      const tasks = new Map<string, Task>()

      if (!this.taskPath) {
        return resolve(tasks)
      }

      if (fs.existsSync(this.taskPath)) {
        fs.globSync(path.join(this.taskPath, 'task-*.json'))
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

  get metricsByModel(): Promise<Record<string, SummaryMetrics>> {
    this._metricsByModel ??= new Promise(async (resolve) => {
      const metricsByModel: Record<string, SummaryMetrics> = {}
      const tasks = [...(await this.tasks).values()]
      const taskMetricsByModelPromises = tasks.map(task => task.metricsByModel)
      const allTaskMetricsByModel = await Promise.all(taskMetricsByModelPromises)

      for (const taskMetricsByModel of allTaskMetricsByModel) {
        for (const [model, metrics] of Object.entries(taskMetricsByModel)) {
          if (!metricsByModel[model]) {
            metricsByModel[model] = initialisedSummaryMetrics()
          }
          addSummaryMetrics(metricsByModel[model], metrics)
        }
      }
      resolve(metricsByModel)
    })
    return this._metricsByModel
  }

  async getTaskById(id: string) {
    const tasks = await this.tasks
    const index = parseInt(id, 10)
    if (!isNaN(index)) {
      for (const task of tasks.values()) {
        if (task.index === index) {
          return task
        }
      }
    }
    return tasks.get(id)
  }

  addTask(task: Task): void {
    if (this._tasks) {
      this._tasks = this._tasks.then(tasks => {
        task.index = tasks.size
        tasks.set(task.id, task)
        return tasks
      })
    } else {
      task.index = 0
      this._tasks = Promise.resolve(new Map([[task.id, task]]))
    }
    this.invalidateMetrics()
  }

  invalidateMetrics(): void {
    this._metrics = undefined
    this._metricsByModel = undefined
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