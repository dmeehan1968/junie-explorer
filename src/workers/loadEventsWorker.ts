import { EventRecord } from "../schema/eventRecord.js"
import { loadEvents } from "./loadEvents.js"
declare var self: Worker;

interface LoadEventsInput {
  eventsFilePath: string
}

interface LoadEventsOutput {
  events: EventRecord[]
}

self.onmessage = async (ev: MessageEvent<LoadEventsInput>) => {
  const data = ev.data
  if (!data) {
    self.postMessage({ ok: false, error: new Error('No data provided') })
  }
  try {
    const result: LoadEventsOutput = await loadEvents(data.eventsFilePath)
    self.postMessage({ ok: true, result })
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}