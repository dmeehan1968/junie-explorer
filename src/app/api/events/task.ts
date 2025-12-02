import express from "express"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../../types"
import { pruneEventLinks } from "../../../utils/pruneEventLinks"

const router = express.Router({ mergeParams: true })

router.use('/api/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// API endpoint to get task data for a specific issue (migrated from issueRoutes)
router.get('/api/project/:projectName/issue/:issueId/task/:taskId', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task } = req

    res.json({
      logPath: task!.logPath,
      id: task!.id,
      created: task!.created,
      context: task!.context,
      isDeclined: task!.isDeclined,
      plan: task!.plan,
      eventsFile: task!.eventsFile,
      events: pruneEventLinks(await task!.events),
      trajectoriesFile: task!.trajectoriesFile,
      steps: task!.steps,
      metrics: await task!.metrics,
      previousTasksInfo: task!.previousTasksInfo,
      finalAgentState: task!.finalAgentState,
      sessionHistory: task!.sessionHistory,
      patch: task!.patch,
    })
  } catch (error) {
    console.error('Error fetching task data:', error)
    res.status(500).json({ error: 'An error occurred while fetching task data' })
  }
})

export default router