import fs from "fs-extra"
import path from "node:path"
import { addSummaryMetrics, initialisedSummaryMetrics, JunieChainSchema, SummaryMetrics } from "./schema"
import { Task } from "./Task"

export interface IssueState {
  id: string
  name: string
  created: Date
  state: string
  error?: any
  logPath?: string
  taskPath?: string
}

export abstract class Issue {
  public readonly id: string
  public name: string
  public readonly created: Date
  public state: string
  public error?: any
  public readonly logPath: string | undefined
  public readonly taskPath: string | undefined

  protected _tasks: Promise<Map<string, Task>> | undefined = undefined
  protected _metrics: Promise<SummaryMetrics> | undefined = undefined
  protected _metricsByModel: Promise<Record<string, SummaryMetrics>> | undefined = undefined

  protected constructor(state: IssueState) {
    this.id = state.id
    this.name = state.name
    this.created = state.created
    this.state = state.state
    this.error = state.error
    this.logPath = state.logPath
    this.taskPath = state.taskPath
  }

  static fromChainFile(logPath: string): Issue {
    const issueJson = JunieChainSchema.safeParse(fs.readJsonSync(logPath))
    if (!issueJson.success) {
      throw new Error(`Error parsing JunieChain at ${logPath}: ${issueJson.error.message}`)
    }

    return new ChainIssue({
      id: issueJson.data.id.id,
      name: issueJson.data.name ?? "-No Name-",
      created: issueJson.data.created,
      state: issueJson.data.state,
      error: issueJson.data.error,
      logPath: logPath,
      taskPath: path.join(logPath, "..", path.parse(logPath).name),
    })
  }

  static fromAia(id: string, created: Date, task: Task): Issue {
    return new AiaIssue({
      id: id,
      name: id,
      created: created,
      state: "Running",
    }, task)
  }

  abstract reload(): void

  abstract get canMerge(): boolean
  abstract get agentName(): string
  abstract get agentIcon(): string

  get tasks(): Promise<Map<string, Task>> {
    this._tasks ??= this.loadTasks()
    return this._tasks
  }

  protected abstract loadTasks(): Promise<Map<string, Task>>

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
      const taskMetricsByModelPromises = tasks.map((task) => task.metricsByModel)
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
      this._tasks = this._tasks.then((tasks) => {
        tasks.set(task.id, task)
        // Sort tasks by creation date and reassign indices
        const sortedTasks = [...tasks.values()].sort((a, b) => a.created.getTime() - b.created.getTime())
        const sortedMap = new Map<string, Task>()
        sortedTasks.forEach((t, index) => {
          t.index = index
          sortedMap.set(t.id, t)
        })
        return sortedMap
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
            const key = `${p.provider}|${p.name ?? ""}|${p.jbai ?? ""}`
            if (!unique.has(key)) {
              unique.set(key, p)
            }
          }
        }),
      )
      return new Set(unique.values())
    })()
  }
}

export class ChainIssue extends Issue {
  constructor(state: IssueState) {
    super(state)
  }

  get canMerge(): boolean {
    return false
  }

  get agentName(): string {
    return "Junie"
  }

  get agentIcon(): string {
    return "https://resources.jetbrains.com/storage/products/company/brand/logos/Junie_icon.svg"
  }

  reload() {
    this._tasks = undefined
    this.invalidateMetrics()
    if (this.logPath) {
      const issue = JunieChainSchema.safeParse(fs.readJsonSync(this.logPath))
      if (issue.success) {
        this.name = issue.data.name ?? "-No Name-"
        this.state = issue.data.state
        this.error = issue.data.error
      }
    }
  }

  protected async loadTasks(): Promise<Map<string, Task>> {
    const tasks = new Map<string, Task>()

    if (!this.taskPath) {
      return tasks
    }

    if (fs.existsSync(this.taskPath)) {
      fs.globSync(path.join(this.taskPath, "task-*.json"))
        .map((path) => new Task(path))
        .sort((a, b) => a.created.getTime() - b.created.getTime())
        .forEach((task) => tasks.set(task.id, task))
    }

    return tasks
  }
}

export class AiaIssue extends Issue {
  constructor(state: IssueState, initialTask: Task) {
    super(state)
    this._tasks = Promise.resolve(new Map([[this.id + " 0", initialTask]]))
    void (async () => {
      const records = await initialTask.loadEvents() // load events without caching
      records.forEach((record) => {
        if (record.event.type === "TaskSummaryCreatedEvent") {
          this.name = record.event.taskSummary
        } else if (record.event.type === "TaskResultCreatedEvent") {
          this.state = record.event.taskResult.state.isFinished ? "Finished" : "Stopped"
        }
      })
    })()
  }

  get canMerge(): boolean {
    return true
  }

  get agentName(): string {
    return "AI Assistant"
  }

  get agentIcon(): string {
    return "https://resources.jetbrains.com/storage/products/company/brand/logos/AI_icon.svg"
  }

  reload() {
    this._tasks = undefined
    this.invalidateMetrics()
  }

  protected async loadTasks(): Promise<Map<string, Task>> {
    return new Map()
  }
}