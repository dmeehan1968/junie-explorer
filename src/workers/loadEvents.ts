import fs from "fs-extra"
import { EventRecord } from "../schema/eventRecord.js"
import { UnknownEventRecord } from "../schema/unknownEventRecord.js"

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
            timestamp: new Date(),
            event: {
              type: 'jsonError',
              data: line,
            },
          }
        }
        const { success, data, error } = EventRecord.safeParse(json)
        if (success) {
          return data
        }
        console.log('EventParserError:', JSON.stringify({
          eventsFile,
          lineNumber,
          message: error.issues[0].message,
          path: error.issues[0].path,
          json,
        }, null, 2))
        return UnknownEventRecord.transform(record => ({ ...record, parseError: error })).parse(json)

      })
      .filter((event): event is EventRecord => !!event)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return { events }
  }

  return { events: [] }
}