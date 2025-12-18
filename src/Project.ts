import { Issue, AiaIssue } from "./Issue"
import { addSummaryMetrics, initialisedSummaryMetrics, SummaryMetrics } from "./schema"
import { IssueDiscoveryService } from "./services/IssueDiscoveryService"
import { CompositeIssueDiscoveryService } from "./services/CompositeIssueDiscoveryService"
import { TaskIssueMapStore } from "./services/TaskIssueMapStore"

export class Project {
  readonly logPaths: string[] = []
  private _metrics: Promise<SummaryMetrics> | undefined
  private _ideNames: Set<string> = new Set()
  private readonly discoveryService: IssueDiscoveryService
  public lastUpdated?: Date
  public hasMetrics: boolean = false

  constructor(
    public readonly name: string,
    logPath: string,
    ideName: string,
    taskIssueMapStore?: TaskIssueMapStore,
    discoveryService?: IssueDiscoveryService,
  ) {
    this.logPaths.push(logPath)
    this._ideNames.add(ideName)
    this.discoveryService = discoveryService ?? new CompositeIssueDiscoveryService(taskIssueMapStore)
  }

  private _issues: Promise<Map<string, Issue>> | undefined = undefined
  get issues(): Promise<Map<string, Issue>> {
    this._issues ??= new Promise(async (resolve) => {
      const issues = await this.discoveryService.discover(this.logPaths)

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
        }),
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

    if (!(targetIssue instanceof AiaIssue) || !(sourceIssue instanceof AiaIssue)) {
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