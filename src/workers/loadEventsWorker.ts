import fs from "fs-extra"
import { ThreadWorker } from "poolifier-web-worker"
// NB: Need to use an alias as the worker doesn't load this in the same working directory for a relative path
import { EventRecord, UnknownEventRecord } from "../eventSchema.js"

interface LoadEventsInput {
  eventsFilePath: string
}

interface LoadEventsOutput {
  events: (EventRecord | UnknownEventRecord)[]
}

async function loadEventsFunction(data?: LoadEventsInput): Promise<LoadEventsOutput> {
  if (!data) {
    throw new Error('No data provided')
  }
  const { eventsFilePath } = data

  if (fs.existsSync(eventsFilePath)) {
    const content = fs.readFileSync(eventsFilePath, 'utf-8')
    return {
      events: content
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
            console.log(eventsFilePath, lineNumber, error.errors[0].code, error.errors[0].path, error.errors[0].message, line.slice(0, 100))
            return UnknownEventRecord.transform(record => ({ ...record, parseError: error })).parse(json)
          }
        })
        .filter((event): event is any => !!event)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    }

  }

  return { events: [] }
}

export default new ThreadWorker(loadEventsFunction, {
  maxInactiveTime: 60000,
})