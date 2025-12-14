import fs from "fs-extra"
import path from "node:path"
import { Issue } from "./Issue"
import { Logger } from "./jetbrains"
import { addSummaryMetrics, initialisedSummaryMetrics, SummaryMetrics } from "./schema"
import { TaskIssueMapStore } from "./services/TaskIssueMapStore"
import { Task } from "./Task"

export class Project {
  readonly logPaths: string[] = []
  private _metrics: Promise<SummaryMetrics> | undefined
  private _ideNames: Set<string> = new Set()
  private readonly logger: Logger
  private readonly taskIssueMapStore?: TaskIssueMapStore
  public lastUpdated?: Date
  public hasMetrics: boolean = false

  constructor(public readonly name: string, logPath: string, ideName: string, logger?: Logger, taskIssueMapStore?: TaskIssueMapStore) {
    this.logPaths.push(logPath)
    this._ideNames.add(ideName)
    this.logger = logger ?? console
    this.taskIssueMapStore = taskIssueMapStore
  }

  private _issues: Promise<Map<string, Issue>> | undefined = undefined
  get issues(): Promise<Map<string, Issue>> {
    this._issues ??= new Promise(async (resolve) => {

      const issues = new Map<string, Issue>()

      // First locate non-AI Assistant (AIA) issues

      for (const logPath of this.logPaths) {
        const root = path.join(logPath, 'issues')

        if (!fs.existsSync(root)) {
          console.error(root, 'does not exist, ignoring')
          continue
        }

        fs.globSync(path.join(root, 'chain-*.json'))
          .map(path => new Issue(path))
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(issue => issues.set(issue.id, issue))

        // Second, locate AIA tasks and create a placeholder issue using the same UUID

        const eventsPath = path.join(logPath, 'events')

        if (!fs.existsSync(eventsPath)) {
          continue
        }

        const eventsRegex = /(?<id>[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-events\.jsonl$/i

        // Get all persisted task-issue mappings
        const taskIssueMappings = this.taskIssueMapStore
          ? await this.taskIssueMapStore.getAllMappings()
          : {}

        // Collect all AIA tasks first
        const aiaTasks = fs.globSync(path.join(eventsPath, '*-events.jsonl'))
          .filter(filePath => eventsRegex.test(filePath))
          .map(filePath => {
            const created = fs.statSync(filePath).mtime
            const id = (filePath.match(eventsRegex)?.groups?.id ?? '')
            const task = new Task(id, created, filePath)
            return { id: task.id, created, task }
          })

        // Separate tasks into unmapped (create new issues) and mapped (add to existing)
        const unmappedTasks = aiaTasks.filter(({ id }) => !taskIssueMappings[id])
        const mappedTasks = aiaTasks.filter(({ id }) => taskIssueMappings[id])

        // First pass: create issues for unmapped tasks (only if not already loaded from chain files)
        for (const { id, created, task } of unmappedTasks) {
          if (!issues.has(id)) {
            issues.set(id, new Issue(id, created, task))
          }
        }

        // Second pass: add mapped tasks to their target issues
        for (const { id, task } of mappedTasks) {
          const targetIssueId = taskIssueMappings[id]
          const targetIssue = issues.get(targetIssueId)
          if (targetIssue && targetIssue.isAIA) {
            targetIssue.addTask(task)
          } else {
            // Target issue doesn't exist or isn't AIA, create standalone issue (only if not already exists)
            if (!issues.has(id)) {
              issues.set(id, new Issue(id, task.created, task))
            }
          }
        }
      }

      const sortedIssues = [...issues.entries()].sort((a, b) =>
        b[1].created.getTime() - a[1].created.getTime(),
      )

      this.lastUpdated = sortedIssues[0]?.[1]?.created

      return resolve(new Map(sortedIssues))
    })

    return this._issues
  }

  async getIssueById(id: string) {
    return (await this.issues).get(id)
  }

  reload() {
    this._issues = undefined
    this._metrics = undefined
  }

  get metrics(): Promise<SummaryMetrics> {
    this._metrics ??= new Promise(async (resolve) => {
      const metrics: SummaryMetrics = initialisedSummaryMetrics()

      await Promise.all([...(await this.issues).values()].map(async (issue) => {
        addSummaryMetrics(metrics, await issue.metrics)
      }))

      this.hasMetrics = metrics.metricCount > 0

      return resolve(metrics)
    })

    return this._metrics
  }

  get ideNames() {
    return [...this._ideNames]
  }

  addLogPath(logPath: string, ideName: string) {
    this.logPaths.push(logPath)
    this._ideNames.add(ideName)
    this._issues = undefined
    this._metrics = undefined
  }

  // Aggregate distinct assistant providers across all issues in this project
  get assistantProviders(): Promise<Set<{ provider: string; name?: string; jbai?: string }>> {
    return (async () => {
      const unique = new Map<string, { provider: string; name?: string; jbai?: string }>()
      const issues = [...(await this.issues).values()]
      await Promise.all(
        issues.map(async (issue) => {
          const providers = await issue.assistantProviders
          for (const p of providers) {
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

  invalidateMetrics(): void {
    this._metrics = undefined
  }

  async mergeIssues(targetIssueId: string, sourceIssueId: string): Promise<Issue | undefined> {
    const issues = await this.issues
    const targetIssue = issues.get(targetIssueId)
    const sourceIssue = issues.get(sourceIssueId)

    if (!targetIssue || !sourceIssue) {
      return undefined
    }

    if (!targetIssue.isAIA || !sourceIssue.isAIA) {
      return undefined
    }

    const sourceTasks = await sourceIssue.tasks
    for (const [_, task] of sourceTasks) {
      targetIssue.addTask(task)
    }

    issues.delete(sourceIssueId)

    this.invalidateMetrics()

    return targetIssue
  }

}