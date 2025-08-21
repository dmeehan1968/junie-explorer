import express from "express"
import { Issue } from "../../Issue.js"
import { Project } from "../../Project.js"
import { Task } from "../../Task.js"
import { AppRequest, AppResponse } from "../types.js"

const router = express.Router({ mergeParams: true })

export async function refreshHandler(req: AppRequest, res: AppResponse) {
  const { jetBrains } = req
  const referer = req.headers.referer
  if (referer) {
    const url = new URL(referer)
    const parts = url.pathname.split('/')
    const projectId = parts[2]
    const issueId = parts[4]

    console.log('Reloading', JSON.stringify({ projectId, issueId }))

    let project: Project | undefined = projectId && await jetBrains?.getProjectByName(projectId) || undefined
    let issue: Issue | undefined = issueId && await project?.getIssueById(issueId) || undefined

    if (issue) {
      issue.reload()
    } else if (project) {
      project.reload()
    } else {
      await jetBrains!.reload()
    }

    await jetBrains!.metrics // causes the metrics to be recalculated which will load other needed data
  }

  res.redirect(req.headers.referer || '/')
}
router.get('/refresh', refreshHandler)

export default router