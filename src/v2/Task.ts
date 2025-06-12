import fs from "fs-extra"
import path from "path"
import { inspect } from "util"
import { JuniePlan, JunieTaskContext, JunieTaskSchema, SummaryMetrics } from "./schema.js"
import { Step } from "./Step.js"

export class Task {
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