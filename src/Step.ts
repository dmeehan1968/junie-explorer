import fs from "fs-extra"
import { inspect } from "node:util"
import { Dependencies, Description, JunieStatistics, JunieStepSchema, StepContent } from "./schema.js"

export interface Metrics {
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  cost: number;
  cachedCost: number;
  buildTime: number;
  artifactTime: number;
  modelTime: number;
  modelCachedTime: number;
  requests: number;
  cachedRequests: number;
}

export class Step {
  id: number
  startTime: Date
  endTime: Date
  title: string
  reasoning: {
    type: string;
    reason: any;
  }
  statistics: JunieStatistics
  metrics: Metrics

  private _content?: StepContent | null
  private _dependencies?: Dependencies[] | null
  private _description?: Description | null

  constructor(public readonly logPath: string) {
    const step = this.load()

    const id = step.id.match(/step_(\d+)/)?.[1]
    if (id === undefined) {
      throw new Error(`Could not extract step id from ${logPath}`)
    }
    this.id = parseInt(id)
    this.endTime = fs.statSync(logPath).birthtime
    this.startTime = new Date(this.endTime.getTime() - step.statistics.modelTime)

    this.title = step.title
    this.reasoning = step.reasoning
    this.statistics = step.statistics
    this.metrics = {
      inputTokens: this.statistics.inputTokens,
      outputTokens: this.statistics.outputTokens,
      cacheTokens: this.statistics.cacheCreateInputTokens,
      cost: this.statistics.cost,
      cachedCost: this.statistics.cachedCost,
      buildTime: this.statistics.artifactTime,
      artifactTime: this.statistics.totalArtifactBuildTimeSeconds,
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
    return this.lazyload()._description
  }

  toJSON() {
    return {
      logPath: this.logPath,
      id: this.id,
      startTime: this.startTime,
      endTime: this.endTime,
      title: this.title,
      reasoning: this.reasoning,
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