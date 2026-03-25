import express from "express"
import { z } from "zod"
import { AgentActionExecutionStarted } from "../../../schema/agentActionExecutionStarted"
import {
  BackwardCompatibleActionRequestBuildingFinishedSerializer as BackwardCompatibleSchema,
} from "../../../schema/backwardCompatibleActionRequestBuildingFinishedSerializer"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../../types"

type BackwardCompatibleEvent = z.infer<typeof BackwardCompatibleSchema>

type EventRecord = { event: { type: string; [key: string]: unknown }, timestamp: Date }

type ActionEvent = {
  timestamp: string
  eventType: string
  actionName?: string
  inputParamValue?: string
}

export function buildActionEvents(events: EventRecord[]): ActionEvent[] {
  return events.flatMap(e => {
    if (e.event.type === 'AgentActionExecutionStarted') {
      const ev = e.event as AgentActionExecutionStarted
      return [{
        timestamp: e.timestamp.toISOString(),
        eventType: 'AgentActionExecutionStarted',
        actionName: ev.actionToExecute.name,
        inputParamValue: JSON.stringify(
          (typeof ev.actionToExecute.inputParams === 'object' && 'rawJsonObject' in ev.actionToExecute.inputParams)
            ? (ev.actionToExecute.inputParams as any).rawJsonObject
            : ev.actionToExecute.inputParams,
        ),
      }]
    }

    if (e.event.type === 'AgentActionExecutionFinished') {
      return [{
        timestamp: e.timestamp.toISOString(),
        eventType: 'AgentActionExecutionFinished',
      }]
    }

    if (e.event.type === BackwardCompatibleSchema.shape.type.value) {
      const ev = e.event as unknown as BackwardCompatibleEvent
      return ev.actionRequests.map(action => ({
        timestamp: e.timestamp.toISOString(),
        eventType: 'BackwardCompatibleActionRequestBuildingFinished',
        actionName: action.name,
        inputParamValue: JSON.stringify(
          (typeof action.inputParams === 'object' && action.inputParams !== null && 'rawJsonObject' in action.inputParams)
            ? (action.inputParams as any).rawJsonObject
            : action.inputParams,
        ),
      }))
    }

    return []
  })
}

const router = express.Router({ mergeParams: true })

router.use('/api/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// Task action timeline API endpoint
router.get('/api/project/:projectId/issue/:issueId/task/:taskId/trajectories/timeline', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task } = req
    const events = await task!.events
    res.json(buildActionEvents(events as EventRecord[]))
  } catch (error) {
    console.error('Error fetching action timeline events:', error)
    res.status(500).json({ error: 'An error occurred while fetching action timeline events' })
  }
})

export default router