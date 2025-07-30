import fs from "fs-extra"
import os from "node:os"
import path from "node:path"
import * as process from "node:process"
import { fileURLToPath } from "node:url"
import { inspect } from 'node:util'
import { Project } from "./Project.js"
import { SummaryMetrics } from "./schema.js"
import publicFiles from "./bun/public.js"
import semver from "semver"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface JetBrainsOptions {
  logPath?: string
  logger?: { log: (...message: any[]) => void }
}

export interface Logger {
  log: (...message: any[]) => void
}

interface FormatMemoryOptions {
  showChange?: boolean
}

export interface Version {
  currentVersion: string,
  newVersion: string,
  releaseUrl: string,
}

export class JetBrains {

  private readonly memory: Record<string, ReturnType<typeof process.memoryUsage>> = {
    [new Date().toISOString()]: process.memoryUsage(),
  }
  private readonly _logPath: string | undefined
  private readonly logger: { log: (...message: any[]) => void }

  private _metrics: Promise<SummaryMetrics> | undefined
  private _version?: Version

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

  getCurrentLocaleFromEnv = (): string | undefined => {
    // Prioritize LC_ALL, then LANG
    const lcAll = process.env.LC_ALL ?? process.env.LC_CTYPE
    const lang = process.env.LANG

    if (lcAll) {
      // LC_ALL often includes encoding, e.g., "en_US.UTF-8"
      // We want just the language tag, so we might need to clean it
      return lcAll.split('.')[0].replace('_', '-') // "en_US" -> "en-US"
    } else if (lang) {
      return lang.split('.')[0].replace('_', '-')
    }
    return undefined // No specific locale found in environment variables
  }

  private formatMemory(before: number, after: number, options: FormatMemoryOptions = {}) {
    const toMB = (bytes: number) => Intl.NumberFormat(this.getCurrentLocaleFromEnv() ?? [], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(bytes / 1024 / 1024)  //.toFixed(2)
    if (!options.showChange) {
      return toMB(after)
    }
    const change = after - before
    const sign = change >= 0 ? '+' : ''
    return `${toMB(after)} (${sign}${toMB(change)})`
  }

  async preload() {
    try {
      await this.checkForUpdates()
    } catch (error) {
      console.error('Unable to check for updates:', error)
    }

    this.logger.log('Reading logs, please wait...')
    const start = Date.now()

    await this.metrics  // forces a full load

    const duration = (Date.now() - start) / 1000

    console.log('Loaded in', duration, 'seconds')
    this.memoryReport()
  }

  private memoryReport() {
    this.memory[new Date().toISOString()] = process.memoryUsage()
    if (/1|true|yes/i.test(process.env.MEMORY_REPORT ?? 'false')) {
      console.log('Memory usage (MB):')
      const table = Object.fromEntries(Object.entries(this.memory)
        .map(([timestamp, memoryUsage], index, memory) => {
          const previousUsage = memory[index - 1]?.[1]
          return [
            timestamp,
            Object.fromEntries(Object.entries(memoryUsage)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([type, value]) => {
                return [
                  type,
                  this.formatMemory(previousUsage?.[type as never] ?? 0, value, { showChange: previousUsage !== undefined }),
                ]
              })),
          ]
        }))
      console.table(table)
    }
  }

  async reload() {
    this._projects = undefined
    this._metrics = undefined
    await this.preload()
  }

  private _projects: Promise<Map<string, Project>> | undefined = undefined

  get metrics(): Promise<SummaryMetrics> {
    if (this._metrics) {
      return this._metrics
    }

    this._metrics = new Promise(async (resolve) => {

      const projects = await Promise.all([...(await this.projects).values()].map(async project => project.metrics))
      const metrics = projects.reduce((acc, cur) => {
        return {
          ...acc,
          inputTokens: acc.inputTokens + cur.inputTokens,
          outputTokens: acc.outputTokens + cur.outputTokens,
          cacheTokens: acc.cacheTokens + cur.cacheTokens,
          cost: acc.cost + cur.cost,
          time: acc.time + cur.time,
        }
      }, { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0 } satisfies SummaryMetrics)

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
          this.logger.log('Skipping', ideDir.name, 'because it does not have a projects directory')
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

  get projectsPath() {
    return path.join(this.logPath, 'projects')
  }

  get ideNames(): Promise<string[]> {
    return new Promise(async (resolve) => {
      const names = new Set<string>()
      for (const project of (await this.projects).values()) {
        for (const ideName of project.ideNames) {
          names.add(ideName)
        }
      }
      return [...names]
    })
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

  get version() {
    return this._version
  }

  async checkForUpdates() {

    const response = await fetch('https://api.github.com/repos/dmeehan1968/junie-explorer/releases/latest')
    const latest = await response.json()
    const currentVersion = JSON.parse(publicFiles['version.txt'])

    if (semver.lt(currentVersion, latest.tag_name)) {
      this._version = {
        currentVersion,
        newVersion: latest.tag_name,
        releaseUrl: latest.html_url
      }

      const width = 80
      console.log('┌' + '─'.repeat(width) + '┐')
      console.log('│' + ` New version available: ${latest.tag_name} `.padEnd(width) + '│')
      console.log('│' + ` ${latest.html_url.padEnd(width-1)}` + '│')
      console.log('└' + '─'.repeat(width) + '┘')
    }
  }

}

