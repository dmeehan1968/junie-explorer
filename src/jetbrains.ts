import fs from "fs-extra"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { inspect } from 'node:util'
import { Project } from "./Project.js"
import { SummaryMetrics } from "./schema.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface JetBrainsOptions {
  logPath?: string
  logger?: { log: (...message: any[]) => void }
}

export interface Logger {
  log: (...message: any[]) => void
}

export class JetBrains {

  private readonly _logPath: string | undefined
  private readonly logger: { log: (...message: any[]) => void }

  private _metrics: SummaryMetrics | undefined

  constructor(options?: JetBrainsOptions) {
    if (!options) {
      options = {}
    }
    if (options && !options.logger) {
      options.logger = console
    }

    this._logPath = options.logPath
    this.logger = options.logger ?? console
  }

  preload() {
    this.logger.log('Reading logs...')
    const start = Date.now()
    this.metrics  // forces a full load
    console.log('Loaded in ', (Date.now() - start) / 1000, 'seconds')
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
        this.logger.log('Skipping', ideDir.name, 'because it does not have a projects directory')
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
            this._projects.set(entry.name, new Project(entry.name, entry.logPath, ideName, this.logger))
            return
          }
          existing.addLogPath(entry.logPath, ideName)
        })

    }

    this._projects = new Map([...this._projects.entries()].sort((a, b) => a[0].localeCompare(b[0])))

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
    if (this._logPath) {
      return path.join(__dirname, '..', this._logPath)

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

