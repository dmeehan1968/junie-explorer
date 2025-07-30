import { ThreadWorker } from "poolifier-web-worker"
import { EventRecord, UnknownEventRecord } from "../eventSchema.js"
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
  return loadEvents(eventsFilePath)
}

export default new ThreadWorker(loadEventsFunction, {
  maxInactiveTime: 60000,
})