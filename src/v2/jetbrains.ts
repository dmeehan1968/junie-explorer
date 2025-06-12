import fs from "fs-extra"
import os from "os"
import path from "path"
import { inspect } from 'util'
import { z } from 'zod'

const JunieChainSchema = z.object({
  id: z.object({
    id: z.string().uuid(),
  }),
  name: z.string().or(z.null()),
  created: z.coerce.date(),
  state: z.enum(['Done', 'Stopped', 'Finished', 'Running', 'Declined', 'Failed']),
  error: z.any().optional(),
})

const JuniePlanSchema = z.object({
  description: z.string(),
  status: z.enum(['DONE', 'IN_PROGRESS', 'PENDING', 'ERROR']),
})
type JuniePlan = z.infer<typeof JuniePlanSchema>

const JunieTaskSchema = z.object({
  id: z.object({
    index: z.number(),
  }),
  created: z.coerce.date(),
  artifactPath: z.string(),
  context: z.any(),
  isDeclined: z.boolean(),
  plan: JuniePlanSchema.array().default(() => ([])),
})

const JunieTaskContextSchema = z.object({
  type: z.enum(['CHAT']),
  description: z.string(),
})
type JunieTaskContext = z.infer<typeof JunieTaskContextSchema>

class Task {
  readonly id: string
  readonly created: Date
  readonly context: JunieTaskContext
  readonly isDeclined: boolean
  readonly plan: JuniePlan[]

  constructor(public readonly logPath: string) {
    console.log(logPath)
    const task = JunieTaskSchema.safeParse(fs.readJsonSync(logPath))
    if (!task.success) {
      throw new Error(`Error parsing JunieTask at ${logPath}: ${task.error.message}`)
    }
    this.id = task.data.artifactPath
    this.created = task.data.created
    this.context = task.data.context
    this.isDeclined = task.data.isDeclined
    this.plan = task.data.plan
  }
}


class Issue {
  readonly id: string
  readonly name: string
  readonly created: Date
  readonly state: string
  readonly error?: any
  readonly tasks: Map<string, Task> = new Map()

  constructor(public readonly logPath: string) {
    const issue = JunieChainSchema.safeParse(fs.readJsonSync(logPath))
    if (!issue.success) {
      throw new Error(`Error parsing JunieChain at ${logPath}: ${issue.error.message}`)
    }
    this.id = issue.data.id.id
    this.name = issue.data.name ?? '-No Name-'
    this.created = issue.data.created
    this.state = issue.data.state
    this.error = issue.data.error

    const root = path.join(this.logPath, '..', path.parse(this.logPath).name, 'task-*.json')
    fs.globSync(root)
      .map(path => new Task(path))
      .forEach(task => this.tasks.set(task.id, task))
  }

  toJSON() {
    return {
      logPath: this.logPath,
      id: this.id,
      name: this.name,
      created: this.created,
      state: this.state,
      error: this.error,
      tasks: [...this.tasks],
    }
  }
}

class Project {
  private _logPaths: string[] = []
  constructor(public readonly name: string, logPath: string) {
    this._logPaths.push(logPath)
  }

  private _issues: Map<string, Issue> = new Map()
  get issues() {
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

  addLogPath(logPath: string) {
    this._logPaths.push(logPath)
    this._issues.clear()
  }

  toJSON() {
    return {
      name: this.name,
      logPaths: this._logPaths,
      issues: [...this.issues],
    }
  }
}

class Jetbrains {
  constructor() {

  }

  private _projects: Map<string, Project> = new Map()

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
        .map(entry => ({ name: entry.name, logPath: path.join(root, entry.name, 'matterhorn', '.matterhorn' ) }))
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
    }
  }

  [inspect.custom]() {
    return this.toJSON()
  }
}

const jb = new Jetbrains()
console.log(JSON.stringify(jb, null, 2))
// console.log(jb)

