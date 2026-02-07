import { Router } from "express"
import { AppRequest, AppResponse } from "../types"
import { AiaIssue } from "../../Issue"

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
  const { sourceIssueId, targetTitle } = req.body as { sourceIssueId?: string; targetTitle?: string }

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
  if (!sourceIssue || !(sourceIssue instanceof AiaIssue)) {
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

  if (targetTitle && req.jetBrains.issueDescriptionStore) {
    await req.jetBrains.issueDescriptionStore.setDescription(issueId!, targetTitle, targetIssue.name)
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

router.post("/api/projects/:projectName/issues/:issueId/unmerge", async (req: AppRequest, res: AppResponse) => {
  const { projectName, issueId } = req.params

  if (!req.jetBrains) {
    return res.status(500).json({ error: "JetBrains instance not available" })
  }

  const project = await req.jetBrains.getProjectByName(projectName!)
  if (!project) {
    return res.status(404).json({ error: "Project not found" })
  }

  const issue = await project.getIssueById(issueId!)
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" })
  }
  if (!(issue instanceof AiaIssue)) {
    return res.status(400).json({ error: "Only AIA issues can be unmerged" })
  }

  const tasks = await issue.tasks
  if (tasks.size <= 1) {
    return res.status(400).json({ error: "Issue has only one task and cannot be unmerged" })
  }

  const taskIds = [...tasks.keys()]

  if (req.jetBrains.issueDescriptionStore) {
    // Clear custom description for the merged issue itself
    await req.jetBrains.issueDescriptionStore.setDescription(issueId!, "", issue.name)
    
    // Clear custom descriptions for all constituent tasks
    for (const taskId of taskIds) {
      // Each taskId represents what was/will be an individual issue
      // We don't have the individual issue objects yet, but we know their IDs match taskIds
      await req.jetBrains.issueDescriptionStore.setDescription(taskId, "", "")
    }
  }

  await req.jetBrains.taskIssueMapStore.removeMappings(taskIds)

  // Reload the project to restore the original issues
  project.reload()

  res.json({
    success: true,
    unmergedTaskIds: taskIds
  })
})

export default router
