import path from "node:path"
import { Task } from "./Task"

export class AiaTask extends Task {
  public override readonly logPath = undefined
  public override readonly eventsFile: string
  private readonly uuid: string

  constructor(id: string, created: Date, eventsFile: string) {
    super()
    this.uuid = id
    this.id = id + ' 0'
    this.created = created
    this.eventsFile = eventsFile
    void new Promise(async resolve => {
      const records = await this.loadEvents()
      for (const record of records) {
        if (record.event.type === 'TaskSummaryCreatedEvent') {
          this.context = { description: record.event.taskSummary }
          break
        }
      }
      return resolve(undefined)
    })
  }

  get trajectoriesFile() {
    return path.resolve(this.eventsFile, '../../trajectory', `${this.uuid}.jsonl`)
  }

  public override reload() {
    this.reloadBase()
  }
}