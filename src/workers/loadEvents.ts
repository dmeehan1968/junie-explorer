import fs from "fs-extra"
import { EventRecord, UnknownEventRecord } from "../eventSchema.js"

export async function loadEvents(eventsFile: string) {
  if (fs.existsSync(eventsFile)) {
    const content = fs.readFileSync(eventsFile, 'utf-8')
    const events = content
      .split('\n')
      .filter(json => json.trim())
      .map((line, lineNumber) => {
        let json: any
        try {
          json = JSON.parse(line)
        } catch (error) {
          return {
            type: 'jsonError',
            timestamp: new Date(),
            event: {
              type: 'unparsed',
              data: line,
            },
          }
        }
        try {
          return EventRecord.parse(json)
        } catch (error: any) {
          console.log(eventsFile, lineNumber, error.errors[0].code, error.errors[0].path, error.errors[0].message, line.slice(0, 100))
          return UnknownEventRecord.transform(record => ({ ...record, parseError: error })).parse(json)
        }
      })
      .filter((event): event is any => !!event)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return { events }
  }

  return { events: [] }
}