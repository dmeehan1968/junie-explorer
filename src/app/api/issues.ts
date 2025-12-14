import { Router } from "express"
import { AppRequest, AppResponse } from "../types"

const router = Router()

router.get("/api/issues/:issueId/description", async (req: AppRequest, res: AppResponse) => {
  const { issueId } = req.params
  const store = req.jetBrains?.issueDescriptionStore

  if (!store) {
    return res.status(500).json({ error: "Issue description store not available" })
  }

  const description = await store.getDescription(issueId!)
  res.json({ description })
})

router.put("/api/issues/:issueId/description", async (req: AppRequest, res: AppResponse) => {
  const { issueId } = req.params
  const { description, originalName } = req.body as { description?: string; originalName?: string }
  const store = req.jetBrains?.issueDescriptionStore

  if (!store) {
    return res.status(500).json({ error: "Issue description store not available" })
  }

  if (typeof description !== "string") {
    return res.status(400).json({ error: "Description must be a string" })
  }

  await store.setDescription(issueId!, description, originalName)
  const savedDescription = await store.getDescription(issueId!)

  res.json({ success: true, description: savedDescription })
})

router.post("/api/projects/:projectName/issues/:issueId/merge", async (req: AppRequest, res: AppResponse) => {
  const { projectName, issueId } = req.params
  const { sourceIssueId } = req.body as { sourceIssueId?: string }

  if (!req.jetBrains) {
    return res.status(500).json({ error: "JetBrains instance not available" })
  }

  if (!sourceIssueId) {
    return res.status(400).json({ error: "sourceIssueId is required" })
  }

  const project = await req.jetBrains.getProjectByName(projectName!)
  if (!project) {
    return res.status(404).json({ error: "Project not found" })
  }

  const sourceIssue = await project.getIssueById(sourceIssueId)
  if (!sourceIssue || !sourceIssue.isAIA) {
    return res.status(400).json({ error: "Source issue not found or is not an AIA issue" })
  }

  const sourceTasks = await sourceIssue.tasks
  for (const [_, task] of sourceTasks) {
    await req.jetBrains.taskIssueMapStore.setTaskIssueMapping(task.id, issueId!)
  }

  const targetIssue = await project.mergeIssues(issueId!, sourceIssueId)
  if (!targetIssue) {
    return res.status(400).json({ error: "Could not merge issues. Both issues must be AIA issues." })
  }

  const tasks = await targetIssue.tasks
  const taskIds = [...tasks.keys()]

  res.json({
    success: true,
    targetIssueId: issueId,
    mergedTaskCount: tasks.size,
    taskIds
  })
})

export default router
