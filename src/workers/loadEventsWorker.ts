import { loadEvents } from "./loadEvents"
import { LoadEventsInput } from "./loadEventsInput"
import { LoadEventsOutput } from "./loadEventsOutput"
import { WorkerFileIOCollector } from "./WorkerFileIOCollector"

declare var self: Worker;

// Initialize file I/O monitoring for this worker
const fileIOCollector = new WorkerFileIOCollector(`loadEvents-${Date.now()}`)

self.onmessage = async (ev: MessageEvent<LoadEventsInput>) => {
  const data = ev.data
  if (!data) {
    self.postMessage({ ok: false, error: 'No data provided' })
    return
  }

  try {
    // Clear previous stats before processing
    fileIOCollector.clearStats()
    
    const result: LoadEventsOutput = await loadEvents(data.eventsFilePath)
    
    // Get file I/O stats from this operation
    const fileIOStats = fileIOCollector.getStats()

    self.postMessage({
      ok: true, 
      result,
      fileIOStats: fileIOStats.operations.length > 0 ? fileIOStats : undefined
    })
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}