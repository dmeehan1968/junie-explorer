import fs from "fs-extra"
import path from "node:path"
import { inspect } from "node:util"
import { Issue } from "./Issue.js"
import { Logger } from "./jetbrains.js"
import { SummaryMetrics } from "./schema.js"

export class Project {
  private _logPaths: string[] = []
  private _metrics: Promise<SummaryMetrics> | undefined
  private _ideNames: Set<string> = new Set()
  private readonly logger: Logger

  constructor(public readonly name: string, logPath: string, ideName: string, logger?: Logger ) {
    this._logPaths.push(logPath)
    this._ideNames.add(ideName)
    this.logger = logger ?? console
  }

  private _issues: Promise<Map<string, Issue>> | undefined = undefined
  get issues(): Promise<Map<string, Issue>> {
    this._issues ??= new Promise(async (resolve) => {

      const issues = new Map()

      for (const logPath of this._logPaths) {
        const root = path.join(logPath, 'issues', 'chain-*.json')

        fs.globSync(root)
          .map(path => new Issue(path))
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(issue => issues.set(issue.id, issue))
      }

      return resolve(new Map([...issues.entries()].sort((a, b) =>
        b[1].created.getTime() - a[1].created.getTime(),
      )))
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
      const metrics: SummaryMetrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0, metricCount: 0 }

      await Promise.all([...(await this.issues).values()].map(async (issue) => {
        const issueMetrics = await issue.metrics
        metrics.inputTokens += issueMetrics.inputTokens
        metrics.outputTokens += issueMetrics.outputTokens
        metrics.cacheTokens += issueMetrics.cacheTokens
        metrics.cost += issueMetrics.cost
        metrics.time += issueMetrics.time
        metrics.metricCount += issueMetrics.metricCount
      }))

      this._logPaths.forEach(logPath => this.logger.log('Loaded:', path.resolve(logPath, '../..')))

      return resolve(metrics)
    })

    return this._metrics
  }

  get ideNames() {
    return [...this._ideNames]
  }

  addLogPath(logPath: string, ideName: string) {
    this._logPaths.push(logPath)
    this._ideNames.add(ideName)
    this._issues = undefined
    this._metrics = undefined
  }

}