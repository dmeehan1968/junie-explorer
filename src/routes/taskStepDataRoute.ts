import express from 'express'
import { JetBrains } from "../jetbrains.js"

const router = express.Router()

// API endpoint to get step data for a specific task
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/step/:stepIndex', (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId, stepIndex } = req.params
    const project = jetBrains.getProjectByName(projectName)
    const issue = project?.getIssueById(issueId)
    const task = issue?.getTaskById(taskId)
    const step = task?.getStepById(parseInt(stepIndex, 10))

    if (!project || !issue || !task || !step) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Return only the data needed for the JSON viewer
    res.json(step)
  } catch (error) {
    console.error('Error fetching step data:', error)
    res.status(500).json({ error: 'An error occurred while fetching step data' })
  }
})

export default router