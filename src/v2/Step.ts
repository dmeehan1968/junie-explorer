import fs from "fs-extra"
import { inspect } from "util"
import { Dependencies, Description, JunieStepSchema, StepContent } from "./schema.js"

export class Step {
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