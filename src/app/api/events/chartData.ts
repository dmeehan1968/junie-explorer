import express from "express"
import { makeGroupName } from "../trajectories/contextSize"
import { LlmResponseEvent } from "../../../schema/llmResponseEvent"
import { prepareLlmEventGraphData } from "../../../utils/prepareLlmEventGraphData"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../../types"

const router = express.Router({ mergeParams: true })

router.use('/api/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// Task event chart data API endpoint
router.get('/api/project/:projectId/issue/:issueId/task/:taskId/events/chart-data', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task } = req

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Get events for the task
    const events = await task.events

    // Prepare LLM event graph data
    const llmChartData = prepareLlmEventGraphData(events)

    // Prepare filtered LLM events for client-side filtering
    const llmEvents = events
      .filter((e): e is { event: LlmResponseEvent, timestamp: Date } => e.event.type === 'LlmResponseEvent')
      .map(e => ({
        timestamp: e.timestamp.toISOString(),
        event: {
          type: e.event.type,
          answer: {
            llm: { provider: makeGroupName(e.event) },
            cost: e.event.answer.cost,
            inputTokens: e.event.answer.inputTokens,
            outputTokens: e.event.answer.outputTokens,
            cacheInputTokens: e.event.answer.cacheInputTokens,
            cacheCreateInputTokens: e.event.answer.cacheCreateInputTokens,
          },
        },
      }))

    res.json({
      llmChartData,
      llmEvents,
    })
  } catch (error) {
    console.error('Error fetching chart data:', error)
    res.status(500).json({ error: 'An error occurred while fetching chart data' })
  }
})

export default router
