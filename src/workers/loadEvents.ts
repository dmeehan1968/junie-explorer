import fs from "fs-extra"
import { EventRecord } from "../schema/eventRecord.js"
import { UnknownEventRecord } from "../schema/unknownEventRecord.js"

export async function loadEvents(eventsFile: string) {
  if (fs.existsSync(eventsFile)) {
    let lastMessageCount = 0
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
      .map((record, index) => {
        // for request events for non-summarizer models, the messages contain history of all previous steps, so
        // this removes the repetition
        if (index && record.event.type === 'LlmRequestEvent' && !record.event.modelParameters.model.isSummarizer) {
          const count = record.event.chat.messages.length
          record.event.chat.messages.splice(0, lastMessageCount)
          lastMessageCount = count
        }
        return record
      })

    return { events }
  }

  return { events: [] }
}