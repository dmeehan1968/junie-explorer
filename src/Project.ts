import fs from "fs-extra"
import path from "path"
import { inspect } from "util"
import { Issue } from "./Issue.js"
import { SummaryMetrics } from "./schema.js"

export class Project {
  private _logPaths: string[] = []
  private _metrics: SummaryMetrics | undefined
  private _ideNames: Set<string> = new Set()

  constructor(public readonly name: string, logPath: string, ideName: string) {
    this._logPaths.push(logPath)
    this._ideNames.add(ideName)
  }

  private _issues: Map<string, Issue> = new Map()
  get issues() {
    if (this._issues.size) {
      return this._issues
    }

    for (const logPath of this._logPaths) {
      console.log('Reading logs from', logPath)
      const root = path.join(logPath, 'issues', 'chain-*.json')
      fs.globSync(root)
        .map(path => new Issue(path))
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(issue => this._issues.set(issue.id, issue))
    }

    this._issues = new Map([...this._issues.entries()].sort((a, b) =>
      b[1].created.getTime() - a[1].created.getTime(),
    ))

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

  get ideNames() {
    return [...this._ideNames]
  }

  addLogPath(logPath: string, ideName: string) {
    this._logPaths.push(logPath)
    this._ideNames.add(ideName)
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