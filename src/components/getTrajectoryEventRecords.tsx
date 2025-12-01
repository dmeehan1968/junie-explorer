import { ActionRequestBuildingFailed } from "../schema/actionRequestBuildingFailed"
import { AgentActionExecutionFinished } from "../schema/agentActionExecutionFinished"
import { AgentType } from "../schema/agentType"
import { EventRecord } from "../schema/eventRecord"
import { LlmRequestEvent } from "../schema/llmRequestEvent"
import { LlmResponseEvent } from "../schema/llmResponseEvent"

export interface TrajectoryEventRecord {
  event: LlmRequestEvent | LlmResponseEvent | ActionRequestBuildingFailed | AgentActionExecutionFinished,
  timestamp: Date
}

export function getTrajectoryEventRecords(events: EventRecord[]) {
  return events.filter((record: EventRecord): record is TrajectoryEventRecord => {
    return (
      (record.event.type === 'LlmRequestEvent' && record.event.chat.agentType === AgentType.Assistant)
      || (record.event.type === 'LlmResponseEvent')
      || record.event.type === 'AgentActionExecutionFinished'
      || record.event.type === 'ActionRequestBuildingFailed'
    )
  })
}