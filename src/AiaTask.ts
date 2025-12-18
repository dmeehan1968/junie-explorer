import { Task } from "./Task"

export class AiaTask extends Task {
  public override readonly logPath = undefined
  public override readonly eventsFile: string

  constructor(id: string, created: Date, eventsFile: string) {
    super()
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

  public override reload() {
    this.reloadBase()
  }
}