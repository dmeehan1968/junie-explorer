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
    if (this._issues) {
      return this._issues
    }

    this._issues = new Promise(async (resolve) => {

      const issues = new Map()

      for (const logPath of this._logPaths) {
        this.logger.log('From:', logPath)
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

    return this._issues!
  }

  async getIssueById(id: string) {
    return (await this.issues).get(id)
  }

  get metrics(): Promise<SummaryMetrics> {
    if (this._metrics) {
      return this._metrics
    }

    this._metrics = new Promise(async (resolve) => {
      const metrics: SummaryMetrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0 }

      for (const issue of (await this.issues).values()) {
        metrics.inputTokens += issue.metrics.inputTokens
        metrics.outputTokens += issue.metrics.outputTokens
        metrics.cacheTokens += issue.metrics.cacheTokens
        metrics.cost += issue.metrics.cost
        metrics.time += issue.metrics.time
      }

      return resolve(metrics)
    })

    return this._metrics!
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

  toJSON() {
    return {
      name: this.name,
      logPaths: this._logPaths,
      // issues: [...this.issues],
      metrics: this.metrics,
    }
  }

  [inspect.custom]() {
    return this.toJSON()
  }
}