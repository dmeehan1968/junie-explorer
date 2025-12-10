import express from "express"
import fs from "fs-extra"
import path from "node:path"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../../types"

const router = express.Router({ mergeParams: true })

router.use('/api/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// Task trajectories download route
router.get('/api/project/:projectId/issue/:issueId/task/:taskId/trajectories/download', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task } = req
    const trajectoriesFile = task?.trajectoriesFile

    if (!trajectoriesFile || !fs.existsSync(trajectoriesFile)) {
      return res.status(404).send('Trajectories file not found')
    }

    const filename = path.basename(trajectoriesFile)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/jsonl')

    res.sendFile(path.resolve(trajectoriesFile))
  } catch (error) {
    console.error('Error downloading trajectories file:', error)
    res.status(500).send('An error occurred while downloading the trajectories file')
  }
})

export default router
