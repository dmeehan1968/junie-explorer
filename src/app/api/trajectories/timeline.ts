import express from "express"
import { AgentActionExecutionFinished } from "../../../schema/agentActionExecutionFinished"
import { AgentActionExecutionStarted } from "../../../schema/agentActionExecutionStarted"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../../types"

const router = express.Router({ mergeParams: true })

router.use('/api/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// Task action timeline API endpoint
router.get('/api/project/:projectId/issue/:issueId/task/:taskId/trajectories/timeline', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task } = req

    // Get events for the task
    const events = await task!.events

    // Filter and flatten action events for Action Timeline
    const actionEvents = events
      .filter((e): e is { event: AgentActionExecutionStarted | AgentActionExecutionFinished, timestamp: Date } =>
        e.event.type === 'AgentActionExecutionStarted' || e.event.type === 'AgentActionExecutionFinished',
      )
      .map(e => ({
        timestamp: e.timestamp.toISOString(),
        eventType: e.event.type,
        ...(e.event.type === 'AgentActionExecutionStarted'
          ? {
            actionName: e.event.actionToExecute.name,
            inputParamValue: JSON.stringify(
              (typeof e.event.actionToExecute.inputParams === 'object' && 'rawJsonObject' in e.event.actionToExecute.inputParams)
                ? e.event.actionToExecute.inputParams.rawJsonObject
                : e.event.actionToExecute.inputParams,
            ),
          }
          : {}),
      }))

    res.json(actionEvents)
  } catch (error) {
    console.error('Error fetching action timeline events:', error)
    res.status(500).json({ error: 'An error occurred while fetching action timeline events' })
  }
})

export default router