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

const SessionHistory = z.object({
  viewedFiles: z.string().array(),
  viewedImports: z.string().array(),
  createdFiles: z.string().array(),
  shownCode: z.record(z.object({
    first: z.number(),
    second: z.number(),
  }).array())
})

const TasksInfo = z.object({
  agentState: z.any().nullish(),  // this should be AgentState but I can't figure out how to create the recursive schema
  patch: z.string().nullish(),
  sessionHistory: SessionHistory.nullish(),
})

const AgentIssue = z.object({
  description: z.string(),
  editorContext: z.object({
    recentFiles: z.string().array(),
    openFiles: z.string().array(),
  }),
  previousTasksInfo: TasksInfo.nullish(),
})

const AgentObservation = z.object({
  element: z.object({
    type: z.string(),
    content: z.string(),
    kind: z.enum(['Assistant', 'User']),
  }).nullish(),
  action: z.string().nullish() // as well as the 'special commands', this can include any CLI command
})

const AgentState = z.object({
  issue: AgentIssue,
  observations: AgentObservation.nullish().array(),
  ideInitialState: z.object({
    content: z.string(),
    kind: z.enum(['User']),
  }).nullish()
})

const JunieTaskContext = z.object({
  type: z.enum(['CHAT']).nullish(),
  description: z.string(),
})
type JunieTaskContext = z.infer<typeof JunieTaskContext>


const JunieTaskSchema = z.object({
  id: z.object({
    index: z.number(),
  }),
  created: z.coerce.date(),
  artifactPath: z.string(),
  context: JunieTaskContext,
  isDeclined: z.boolean(),
  plan: JuniePlanSchema.array().default(() => ([])),
  previousTasksInfo: z.object({
    agentState: AgentState,
    patch: z.string().nullish(),
    sessionHistory: SessionHistory.nullish(),
  }).nullish(),
  finalAgentState: AgentState.nullish(),
  sessionHistory: SessionHistory.nullish(),
  patch: z.string().nullish(),

}).transform(({ id: _, artifactPath, ...task }) => ({
  id: artifactPath,
  ...task,
}))

const StepContent = z.object({
  llmResponse: z.object({
    type: z.enum(['com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage']),
    content: z.string(),
    kind: z.enum(['Assistant', 'User']),
  }).optional(),
  actionRequest: z.object({
    type: z.enum(['com.intellij.ml.llm.matterhorn.ej.core.actions.SimpleActionRequest']),
    name: z.string(),
    arguments: z.string(),
    description: z.string(),
  }).optional(),
  actionResult: z.object({
    type: z.enum(['com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage']),
    content: z.string(),
    kind: z.enum(['Assistant', 'User']),
  }).optional(),
})
type StepContent = z.infer<typeof StepContent>

const Dependencies = z.object({
  id: z.string(),
  cached: z.boolean(),
})
type Dependencies = z.infer<typeof Dependencies>

const Description = z.string().transform(v => {
  try {
    return JSON.parse(v)
  } catch (e) {
    console.log(e)
  }
  return v
})
type Description = z.infer<typeof Description>

const JunieStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  reasoning: z.object({
    type: z.enum(['com.intellij.ml.llm.matterhorn.ArtifactReasoning.Success']),
    reason: z.string(),
  }),
  statistics: z.object({
    totalArtifactBuildTimeSeconds: z.number().default(() => 0),
    artifactTime: z.number(),
    modelTime: z.number(),
    modelCachedTime: z.number(),
    requests: z.number(),
    cachedRequests: z.number(),
    inputTokens: z.number(),
    outputTokens: z.number(),
    cacheInputTokens: z.number(),
    cacheCreateInputTokens: z.number(),
    cost: z.number(),
    cachedCost: z.number(),
  }),
  content: StepContent,
  dependencies: Dependencies.array().default(() => ([])),
  description: Description,
})

class Step {
  id: string
  startTime: Date
  endTime: Date
  title: string
  statistics: {
    totalArtifactBuildTimeSeconds: number;
    artifactTime: number;
    modelTime: number;
    modelCachedTime: number;
    requests: number;
    cachedRequests: number;
    inputTokens: number;
    outputTokens: number;
    cacheInputTokens: number;
    cacheCreateInputTokens: number;
    cost: number;
    cachedCost: number;
  }
  metrics: {
    inputTokens: number;
    outputTokens: number;
    cacheTokens: number;
    cost: number;
    cachedCost: number;
    buildTime: number;
    modelTime: number;
    modelCachedTime: number;
    requests: number;
    cachedRequests: number;
  }

  private _content: StepContent | undefined
  private _dependencies: Dependencies[] | undefined
  private _description: Description | undefined

  constructor(public readonly logPath: string) {
    const step = this.load()

    this.id = step.id
    this.endTime = fs.statSync(logPath).birthtime
    this.startTime = new Date(this.endTime.getTime() - (step.statistics.artifactTime + step.statistics.modelTime + step.statistics.modelCachedTime))

    this.title = step.title
    this.statistics = step.statistics
    this.metrics = {
      inputTokens: this.statistics.inputTokens,
      outputTokens: this.statistics.outputTokens,
      cacheTokens: this.statistics.cacheCreateInputTokens,
      cost: this.statistics.cost,
      cachedCost: this.statistics.cachedCost,
      buildTime: this.statistics.artifactTime,
      modelTime: this.statistics.modelTime,
      modelCachedTime: this.statistics.modelCachedTime,
      requests: this.statistics.requests,
      cachedRequests: this.statistics.cachedRequests,
    }
  }

  private load() {
    const step = JunieStepSchema.safeParse(fs.readJsonSync(this.logPath))

    if (!step.success) {
      throw new Error(`Error parsing JunieStep at ${this.logPath}: ${step.error.message}`)
    }

    return step.data
  }

  private lazyload() {
    if (this._content === undefined && this._dependencies === undefined && this._description === undefined) {
      const step = this.load()
      this._content = step.content
      this._dependencies = step.dependencies
      this._description = step.description
    }
    return this
  }

  get content(): StepContent {
    return this.lazyload()._content!
  }

  get dependencies(): Dependencies[] {
    return this.lazyload()._dependencies!
  }

  get description(): Description {
    return this.lazyload()._description!
  }

  toJSON() {
    return {
      logPath: this.logPath,
      id: this.id,
      startTime: this.startTime,
      endTime: this.endTime,
      title: this.title,
      statistics: this.statistics,
      metrics: this.metrics,
      content: this.content,
      dependencies: this.dependencies,
      description: this.description,
    }
  }

  [inspect.custom]() {
    return this.toJSON()
  }
}

interface SummaryMetrics {
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  cost: number;
  time: number;
}

class Task {
  readonly id: string
  readonly created: Date
  readonly context: JunieTaskContext
  readonly isDeclined: boolean
  readonly plan: JuniePlan[]
  readonly steps: Map<string, Step> = new Map()
  readonly metrics: SummaryMetrics

  constructor(public readonly logPath: string) {
    const task = JunieTaskSchema.safeParse(fs.readJsonSync(logPath))
    if (!task.success) {
      throw new Error(`Error parsing JunieTask at ${logPath}: ${task.error.message}`)
    }
    this.id = task.data.id
    this.created = task.data.created
    this.context = task.data.context
    this.isDeclined = task.data.isDeclined
    this.plan = task.data.plan

    const root = path.join(this.logPath, '../../..', this.id, 'step_+([0-9]).*{swe,chat}_next*')
    fs.globSync(root)
      .map(path => new Step(path))
      .map(step => this.steps.set(step.id, step))

    this.metrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0 }
    for (const step of this.steps.values()) {
      this.metrics.inputTokens += step.metrics.inputTokens
      this.metrics.outputTokens += step.metrics.outputTokens
      this.metrics.cacheTokens += step.metrics.cacheTokens
      this.metrics.cost += step.metrics.cost + step.metrics.cachedCost
      this.metrics.time += step.metrics.buildTime + step.metrics.modelTime + step.metrics.modelCachedTime
    }
  }

  toJSON() {
    return {
      logPath: this.logPath,
      id: this.id,
      created: this.created,
      context: this.context,
      isDeclined: this.isDeclined,
      plan: this.plan,
      steps: [...this.steps],
      metrics: this.metrics,
    }
  }

  [inspect.custom]() {
    return this.toJSON()
  }
}


class Issue {
  readonly id: string
  readonly name: string
  readonly created: Date
  readonly state: string
  readonly error?: any
  readonly tasks: Map<string, Task> = new Map()
  readonly metrics: SummaryMetrics = { inputTokens: 0, outputTokens: 0, cacheTokens: 0, cost: 0, time: 0 }

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

    for (const task of this.tasks.values()) {
      this.metrics.inputTokens += task.metrics.inputTokens
      this.metrics.outputTokens += task.metrics.outputTokens
      this.metrics.cacheTokens += task.metrics.cacheTokens
      this.metrics.cost += task.metrics.cost
      this.metrics.time += task.metrics.time
    }
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
      metrics: this.metrics,
    }
  }

  [inspect.custom]() {
    return this.toJSON()
  }
}

class Project {
  private _logPaths: string[] = []
  private _metrics: SummaryMetrics | undefined

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

class Jetbrains {

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

const jb = new Jetbrains()
// console.log(JSON.stringify(jb, null, 2))
console.log(jb.metrics)
const memory = process.memoryUsage()
console.log(`rss: ${Math.round(memory.rss / 1024 / 1024)}MB, heapTotal: ${Math.round(memory.heapTotal / 1024 / 1024)}MB, heapUsed: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`)


