import express from "express"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../../types"

const router = express.Router({ mergeParams: true })

router.use('/api/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// Task event timeline API endpoint
router.get('/api/project/:projectId/issue/:issueId/task/:taskId/events/timeline', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task } = req

    // Get events for the task
    const events = task ? await task.events : []

    // Map events for Event Timeline
    const timelineEvents = events.map(e => ({
      timestamp: e.timestamp.toISOString(),
      event: { type: e.event.type },
    }))

    res.json(timelineEvents)
  } catch (error) {
    console.error('Error fetching timeline events:', error)
    res.status(500).json({ error: 'An error occurred while fetching timeline events' })
  }
})

export default router