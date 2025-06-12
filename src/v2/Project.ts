import fs from "fs-extra"
import path from "path"
import { inspect } from "util"
import { Issue } from "./Issue.js"
import { SummaryMetrics } from "./schema.js"

export class Project {
  private _logPaths: string[] = []
  private _metrics: SummaryMetrics | undefined

  constructor(public readonly name: string, logPath: string) {
    this._logPaths.push(logPath)
  }

  private _issues: Map<string, Issue> = new Map()
  private get issues() {
    if (this._issues.size) {
      return this._issues
    }

    for (const logPath of this._logPaths) {
      const root = path.join(logPath, 'issues', 'chain-*.json')
      fs.globSync(root)
        .map(path => new Issue(path))
        .forEach(issue => this._issues.set(issue.id, issue))
    }

    return this._issues
  }

  getIssueById(id: string) {
    return this.issues.get(id)
  }

  get metrics() {
    if (this._metrics) {
      return this._metrics
    }

    this._metrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0 }

    for (const issue of this.issues.values()) {
      this._metrics.inputTokens += issue.metrics.inputTokens
      this._metrics.outputTokens += issue.metrics.outputTokens
      this._metrics.cacheTokens += issue.metrics.cacheTokens
      this._metrics.cost += issue.metrics.cost
      this._metrics.time += issue.metrics.time
    }

    return this._metrics!
  }

  addLogPath(logPath: string) {
    this._logPaths.push(logPath)
    this._issues.clear()
    this._metrics = undefined
  }

  toJSON() {
    return {
      name: this.name,
      logPaths: this._logPaths,
      issues: [...this.issues],
      metrics: this.metrics,
    }
  }

  [inspect.custom]() {
    return this.toJSON()
  }
}