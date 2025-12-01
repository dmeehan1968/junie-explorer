import { EventRecord } from "../schema/eventRecord"
import { LlmRequestEvent } from "../schema/llmRequestEvent"

interface RequestEventRecord {
  event: LlmRequestEvent,
  timestamp: Date
}

export function getPreviousRequestRecord(records: EventRecord[], predicate: (record: LlmRequestEvent) => boolean) {
  return records
    .reverse()
    .find(record => record.event.type === 'LlmRequestEvent' && predicate(record.event)) as RequestEventRecord | undefined
}