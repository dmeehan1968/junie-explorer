import { ThreadWorker } from "poolifier-web-worker"
import { EventRecord } from "../schema/eventRecord.js"
import { UnknownEventRecord } from "../schema/unknownEventRecord.js"
import { loadEvents } from "./loadEvents.js"

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
  return await loadEvents(eventsFilePath)
}

export default new ThreadWorker(loadEventsFunction, {
  maxInactiveTime: 60000,
})