import path from "node:path"
import { Task } from "./Task"

export class ChainTask extends Task {
  public override readonly logPath: string
  public override readonly eventsFile: string

  constructor(logPath: string) {
    super()
    this.logPath = logPath
    this.init()
    this.eventsFile = path.join(this.logPath, '../../../events', `${this.id}-events.jsonl`)
  }

  private init() {
    const task = this.load()
    if (!task) return
    this.id = task.id
    this.index = task.index
    this.created = task.created
    this.context = task.context
    this.isDeclined = task.isDeclined
    this.plan = task.plan
  }

  public override reload() {
    this.reloadBase()
    this.init()
  }
}