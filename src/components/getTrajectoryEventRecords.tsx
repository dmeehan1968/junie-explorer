import { ActionRequestBuildingFailed } from "../schema/actionRequestBuildingFailed"
import { AgentActionExecutionFinished } from "../schema/agentActionExecutionFinished"
import { EventRecord } from "../schema/eventRecord"
import { LlmRequestEvent } from "../schema/llmRequestEvent"
import { LlmResponseEvent } from "../schema/llmResponseEvent"

export type TrajectoryEvent = LlmRequestEvent | LlmResponseEvent | ActionRequestBuildingFailed | AgentActionExecutionFinished

export interface TrajectoryEventRecord extends Omit<EventRecord, 'event'> {
  event: TrajectoryEvent
}

export function getTrajectoryEventRecords(events: EventRecord[]) {
  return events.filter((record: EventRecord): record is TrajectoryEventRecord => {
    return (
      (record.event.type === 'LlmRequestEvent')
      || (record.event.type === 'LlmResponseEvent')
      || record.event.type === 'AgentActionExecutionFinished'
      || record.event.type === 'ActionRequestBuildingFailed'
    )
  })
}