import fs from "fs-extra"
import os from "os"
import path from "path"
import { fileURLToPath } from "url"
import { inspect } from 'util'
import { Project } from "./Project.js"
import { SummaryMetrics } from "./schema.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class JetBrains {

  private _metrics: SummaryMetrics | undefined
  private _customLogPath?: string

  constructor(customLogPath?: string) {
    this._customLogPath = customLogPath ? path.join(__dirname, '..', customLogPath) : undefined
  }

  preload() {
    console.log('Reading logs...')
    this.metrics  // forces a full load
  }

  reload() {
    this._projects.clear()
    this._metrics = undefined
    this.preload()
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

  getProjectByName(name: string) {
    return this.projects.get(name)
  }

  get projects() {
    if (this._projects.size) {
      return this._projects
    }

    const ideDirs = fs.readdirSync(this.logPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())

    for (const ideDir of ideDirs) {
      const root = path.join(this.logPath, ideDir.name, 'projects')

      if (!fs.existsSync(root)) {
        console.log('Skipping', ideDir.name, 'because it does not have a projects directory')
        continue
      }

      fs.readdirSync(root, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => ({ name: entry.name, logPath: path.join(root, entry.name, 'matterhorn', '.matterhorn') }))
        .filter(entry => fs.existsSync(entry.logPath) && fs.statSync(entry.logPath).isDirectory())
        .forEach(entry => {
          const existing = this._projects.get(entry.name)
          const ideName = ideDir.name.replace(/\d+(\.\d+)?/, '')
          if (!existing) {
            this._projects.set(entry.name, new Project(entry.name, entry.logPath, ideName))
            return
          }
          existing.addLogPath(entry.logPath, ideName)
        })

    }

    return this._projects

  }

  get projectsPath() {
    return path.join(this.logPath, 'projects')
  }

  get ideNames() {
    const names = new Set<string>()
    for (const project of this.projects.values()) {
      for (const ideName of project.ideNames) {
        names.add(ideName)
      }
    }
    return [...names]
  }

  getIDEIcon(ideName: string): string {
    const ideNameMap: Record<string, string> = {
      'AppCode': 'AppCode',
      'CLion': 'CLion',
      'DataGrip': 'DataGrip',
      'GoLand': 'GoLand',
      'IntelliJIdea': 'IntelliJ_IDEA',
      'PhpStorm': 'PhpStorm',
      'PyCharm': 'PyCharm',
      'Rider': 'Rider',
      'WebStorm': 'WebStorm',
    }
    const mappedName = ideNameMap[ideName] ?? 'AI'

    return `https://resources.jetbrains.com/storage/products/company/brand/logos/${mappedName}_icon.svg`;
  }

  get logPath() {
    if (this._customLogPath) {
      return this._customLogPath
    }

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

