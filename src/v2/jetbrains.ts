import fs from "fs-extra"
import os from "os"
import path from "path"
import { inspect } from 'util'
import { Project } from "./Project.js"
import { SummaryMetrics } from "./schema.js"


export class JetBrains {

  private _metrics: SummaryMetrics | undefined

  constructor() {

  }

  private _projects: Map<string, Project> = new Map()

  get metrics() {
    if (this._metrics) {
      return this._metrics
    }
    this._metrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0 }

    for (const project of this.projects.values()) {
      this._metrics.inputTokens += project.metrics.inputTokens
      this._metrics.outputTokens += project.metrics.outputTokens
      this._metrics.cacheTokens += project.metrics.cacheTokens
      this._metrics.cost += project.metrics.cost
      this._metrics.time += project.metrics.time
    }

    return this._metrics!
  }

  get projects() {
    if (this._projects.size) {
      return this._projects
    }

    const ideDirs = fs.readdirSync(this.logPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())

    for (const ideDir of ideDirs) {
      const root = path.join(this.logPath, ideDir.name, 'projects')
      fs.readdirSync(root, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => ({ name: entry.name, logPath: path.join(root, entry.name, 'matterhorn', '.matterhorn') }))
        .filter(entry => fs.existsSync(entry.logPath) && fs.statSync(entry.logPath).isDirectory())
        .forEach(entry => {
          const existing = this._projects.get(entry.name)
          if (!existing) {
            this._projects.set(entry.name, new Project(entry.name, entry.logPath))
            return
          }
          existing.addLogPath(entry.logPath)
        })

    }

    return this._projects

  }

  get projectsPath() {
    return path.join(this.logPath, 'projects')
  }

  get logPath() {
    switch (os.platform()) {
      case 'win32': // Windows
        return path.join(process.env.APPDATA || '', '..', 'Local', 'JetBrains')
      case 'darwin': // macOS
        return path.join('/Users', this.username, 'Library', 'Caches', 'JetBrains')
      default: // Linux and others
        return path.join(os.homedir(), '.cache', 'JetBrains')

    }
  }

  get username() {
    return os.userInfo().username
  }

  toJSON() {
    return {
      logPath: this.logPath,
      username: this.username,
      projectsPath: this.projectsPath,
      projects: [...this.projects],
      metrics: this.metrics,
    }
  }

  [inspect.custom]() {
    return this.toJSON()
  }
}



