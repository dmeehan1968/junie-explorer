import express from "express"
import fs from "fs-extra"
import path from "node:path"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware.js"
import { AppRequest, AppResponse } from "../../types.js"

const router = express.Router()

router.use('/api/project/:projectName/issue/:issueId/task/:taskId', entityLookupMiddleware)

// Task events download route
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/events/download', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task } = req

    if (!fs.existsSync(task!.eventsFile)) {
      return res.status(404).send('Events file not found')
    }

    const filename = path.basename(task!.eventsFile)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/jsonl')

    res.sendFile(path.resolve(task!.eventsFile))
  } catch (error) {
    console.error('Error downloading events file:', error)
    res.status(500).send('An error occurred while downloading the events file')
  }
})

export default router
