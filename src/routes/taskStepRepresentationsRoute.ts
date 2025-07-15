import express from 'express'
import { JetBrains } from "../jetbrains.js"
import { RepresentationService } from '../services/representationService.js'

const router = express.Router()

// API endpoint to get representations for a specific step
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/step/:stepIndex/representations', async (req, res) => {
  try {
    const jetBrains = req.app.locals.jetBrains as JetBrains
    const { projectName, issueId, taskId, stepIndex } = req.params

    const htmlContent = await RepresentationService.getStepRepresentation(
      jetBrains,
      projectName,
      issueId,
      taskId,
      stepIndex,
    )

    res.setHeader('Content-Type', 'text/html')
    res.send(htmlContent)
  } catch (error) {
    console.error('Error fetching step representations:', error)

    if (error instanceof Error) {
      if (error.message === 'Step not found') {
        return res.status(404).send('Step not found')
      }
      if (error.message === 'No representation files found') {
        return res.status(404).send('No representation files found')
      }
      if (error.message === 'More than one representation file found') {
        return res.status(400).send('More than one representation file found')
      }
    }

    res.status(500).send('An error occurred while fetching step representations')
  }
})

export default router