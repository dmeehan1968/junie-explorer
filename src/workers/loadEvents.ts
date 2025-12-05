import fs from "fs-extra"
import { ZodError } from "zod"
import { EventRecord } from "../schema/eventRecord"
import { EventParserError, LoadEventsOutput } from "./loadEventsOutput"

export async function loadEvents(eventsFile: string): Promise<LoadEventsOutput> {
  if (fs.existsSync(eventsFile)) {
    const content = fs.readFileSync(eventsFile, 'utf-8')
    const errors: EventParserError[] = []
    const events = content
      .split('\n')
      .filter(json => json.trim())
      .map((line, lineIndex) => {
        const lineNumber = lineIndex // maintain same indexing as before
        let json: any
        try {
          json = JSON.parse(line)
        } catch (e) {
          errors.push({
            eventsFile,
            lineNumber,
            message: 'JSON parse error',
            path: [],
            json: line,
          })
          return undefined
        }
        const { success, data, error } = EventRecord.safeParse(json)
        if (success) {
          return data
        }
        errors.push({
          eventsFile,
          lineNumber,
          message: error.issues[0]?.message ?? 'Event parse error',
          path: (error.issues[0]?.path ?? []).filter(p => typeof p === 'string' || typeof p === 'number') as (string | number)[],
          json,
        })
        return undefined
      })
      .filter((event): event is EventRecord => !!event)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return { events, errors }
  }

  return { events: [], errors: [] }
}