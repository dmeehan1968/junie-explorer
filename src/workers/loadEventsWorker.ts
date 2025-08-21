import { loadEvents } from "./loadEvents.js"
import { LoadEventsInput } from "./loadEventsInput.js"
import { LoadEventsOutput } from "./loadEventsOutput.js"

declare var self: Worker;

self.onmessage = async (ev: MessageEvent<LoadEventsInput>) => {
  const data = ev.data
  if (!data) {
    self.postMessage({ ok: false, error: 'No data provided' })
  }
  try {
    const result: LoadEventsOutput = await loadEvents(data.eventsFilePath)
    self.postMessage({ ok: true, result })
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}