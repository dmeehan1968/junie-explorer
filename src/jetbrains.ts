import fs from "fs-extra"
import os from "node:os"
import path from "node:path"
import * as process from "node:process"
import { fileURLToPath } from "node:url"
import semver from "semver"
import publicFiles from "./bun/public"
import { Project } from "./Project"
import { addSummaryMetrics, initialisedSummaryMetrics, SummaryMetrics } from "./schema"
import { IssueDescriptionStore } from "./services/IssueDescriptionStore"
import { StatsCollector } from "./stats/StatsCollector"
import { Task } from "./Task"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface JetBrainsOptions {
  logPath?: string
  logger?: { log: (...message: any[]) => void }
  homeDir?: string
}

export interface Logger {
  log: (...message: any[]) => void
}

export interface Version {
  currentVersion: string,
  newVersion: string,
  releaseUrl: string,
}

export class JetBrains {

  private readonly _logPath: string | undefined
  private readonly logger: { log: (...message: any[]) => void }

  private _metrics: Promise<SummaryMetrics> | undefined
  private _version?: Version
  public readonly statsCollector: StatsCollector
  public readonly issueDescriptionStore: IssueDescriptionStore

  public hasMetrics: boolean = false

  constructor(options?: JetBrainsOptions) {
    if (!options) {
      options = {}
    }
    if (options && !options.logger) {
      options.logger = console
    }

    this._logPath = options.logPath
    this.logger = options.logger ?? console
    this.statsCollector = new StatsCollector()
    this.issueDescriptionStore = new IssueDescriptionStore(options.homeDir ?? os.homedir())
    
    // Register stats collector with Task class for WorkerPool monitoring
    Task.setStatsCollector(this.statsCollector)
  }

  async preload() {
    void this.checkForUpdates()   // check for updates in the background

    this.logger.log('Reading logs, patience is a virtue...')
    const start = Date.now()

    await this.metrics  // forces a full load

    const duration = (Date.now() - start) / 1000

    console.log('Loaded in', duration, 'seconds')
  }

  async reload() {
    this._projects = undefined
    this._metrics = undefined
    await this.preload()
  }

  private _projects: Promise<Map<string, Project>> | undefined = undefined

  get metrics(): Promise<SummaryMetrics> {
    this._metrics ??= new Promise(async (resolve) => {

      const metrics = initialisedSummaryMetrics()

      await Promise.all([...(await this.projects).values()].map(async project => {
        addSummaryMetrics(metrics, await project.metrics)
        project.logPaths.forEach(logPath => this.logger.log('Loaded:', path.resolve(logPath, '../..')))
      }))

      this.hasMetrics = metrics.metricCount > 0

      return resolve(metrics)
    })

    return this._metrics
  }

  async getProjectByName(name: string) {
    return (await this.projects).get(name)
  }

  get projects(): Promise<Map<string, Project>> {
    if (this._projects) {
      return this._projects
    }

    this._projects = new Promise(async (resolve) => {

      const projects = new Map<string, Project>()

      const ideDirs = fs.readdirSync(this.logPath, { withFileTypes: true })
        .filter(entry => entry.isDirectory())

      for (const ideDir of ideDirs) {
        const root = path.join(this.logPath, ideDir.name, 'projects')

        if (!fs.existsSync(root)) {
          this.logger.log('Skipping', path.join(ideDir.parentPath, ideDir.name), 'because it does not have a projects directory')
          continue
        }

        const entries = fs.readdirSync(root, { withFileTypes: true })

        entries.filter(entry => entry.isDirectory())
          .map(entry => ({ name: entry.name, logPath: path.join(root, entry.name, 'matterhorn', '.matterhorn') }))
          .filter(entry => fs.existsSync(entry.logPath) && fs.statSync(entry.logPath).isDirectory())
          .forEach(entry => {
            const existing = projects.get(entry.name)
            const ideName = ideDir.name.replace(/\d+(\.\d+)?/, '')
            if (!existing) {
              projects.set(entry.name, new Project(entry.name, entry.logPath, ideName, this.logger))
              return
            }
            existing.addLogPath(entry.logPath, ideName)
          })
      }

      return resolve(new Map([...projects.entries()].sort((a, b) => a[0].localeCompare(b[0]))))
    })

    return this._projects
  }

  getIDEIcon(ideName: string): string {
    const ideNameMap: Record<string, string> = {
      'AppCode': 'AppCode',
      'CLion': 'CLion',
      'CodeWithMe': 'CodeWithMe',
      'DataGrip': 'DataGrip',
      'Fleet': 'Fleet',
      'GoLand': 'GoLand',
      'IntelliJIdea': 'IntelliJ_IDEA',
      'Kotlin': 'Kotlin',
      'PhpStorm': 'PhpStorm',
      'PyCharm': 'PyCharm',
      'Qodana': 'Qodana',
      'Resharper': 'ReSharper',
      'Rider': 'Rider',
      'RustRover': 'RustRover',
      'WebStorm': 'WebStorm',
    }
    const mappedName = ideNameMap[ideName] ?? 'AI'

    return `https://resources.jetbrains.com/storage/products/company/brand/logos/${mappedName}_icon.svg`
  }

  get logPath() {
    if (this._logPath) {
      return path.join(__dirname, '..', this._logPath)
    }

    switch (os.platform()) {
      case 'win32': // Windows
        return path.join(os.homedir(), 'Local', 'JetBrains')
      case 'darwin': // macOS
        return path.join(os.homedir(), 'Library', 'Caches', 'JetBrains')
      default: // Linux and others
        return path.join(os.homedir(), '.cache', 'JetBrains')

    }
  }

  get username() {
    return os.userInfo().username
  }

  get version() {
    return this._version
  }

  async checkForUpdates() {

    try {
      const response = await fetch('https://api.github.com/repos/dmeehan1968/junie-explorer/releases/latest')
      if (!response.ok) {
        console.error('Unable to check for updates:', response.status, response.statusText)
        return
      }
      const latest = await response.json()
      const currentVersion = JSON.parse(publicFiles['version.txt'])

      if (semver.lt(currentVersion, latest.tag_name)) {
        this._version = {
          currentVersion,
          newVersion: latest.tag_name,
          releaseUrl: latest.html_url,

        }

        const width = 80
        console.log('┌' + '─'.repeat(width) + '┐')
        console.log('│' + ` New version available: ${latest.tag_name} `.padEnd(width) + '│')
        console.log('│' + ` ${latest.html_url.padEnd(width - 1)}` + '│')
        console.log('└' + '─'.repeat(width) + '┘')
      }
    } catch (err) {
      console.error('Check for updates failed: ', String(err))
    }
  }

}

