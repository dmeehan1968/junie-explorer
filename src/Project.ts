import fs from "fs-extra"
import path from "node:path"
import { Issue } from "./Issue"
import { Logger } from "./jetbrains"
import { SummaryMetrics } from "./schema"

export class Project {
  readonly logPaths: string[] = []
  private _metrics: Promise<SummaryMetrics> | undefined
  private _ideNames: Set<string> = new Set()
  private readonly logger: Logger
  public lastUpdated?: Date
  public hasMetrics: boolean = false

  constructor(public readonly name: string, logPath: string, ideName: string, logger?: Logger ) {
    this.logPaths.push(logPath)
    this._ideNames.add(ideName)
    this.logger = logger ?? console
  }

  private _issues: Promise<Map<string, Issue>> | undefined = undefined
  get issues(): Promise<Map<string, Issue>> {
    this._issues ??= new Promise(async (resolve) => {

      const issues = new Map<string, Issue>()

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
      const metrics: SummaryMetrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0, metricCount: 0, webSearchCount: 0 }

      await Promise.all([...(await this.issues).values()].map(async (issue) => {
        const issueMetrics = await issue.metrics
        metrics.inputTokens += issueMetrics.inputTokens
        metrics.outputTokens += issueMetrics.outputTokens
        metrics.cacheTokens += issueMetrics.cacheTokens
        metrics.webSearchCount += issueMetrics.webSearchCount
        metrics.cost += issueMetrics.cost
        metrics.time += issueMetrics.time
        metrics.metricCount += issueMetrics.metricCount
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

}