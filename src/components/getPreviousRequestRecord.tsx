import { LlmRequestEvent } from "../schema/llmRequestEvent"
import { TrajectoryEventRecord } from "./getTrajectoryEventRecords"

interface RequestEventRecord {
  event: LlmRequestEvent,
  timestamp: Date
}

export function getPreviousRequestRecord(records: TrajectoryEventRecord[], predicate: (record: LlmRequestEvent) => boolean) {
  return records
    .reverse()
    .find(record => record.event.type === 'LlmRequestEvent' && predicate(record.event)) as RequestEventRecord | undefined
}