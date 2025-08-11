import { AppRequest, AppResponse } from "../types.js"

export async function refreshHandler(req: AppRequest, res: AppResponse) {
  const referer = req.headers.referer
  if (referer) {
    const url = new URL(referer)
    const parts = url.pathname.split('/')
    const projectId = parts[2]
    const issueId = parts[4]
    const taskId = parts[6]

    console.log('Reloading', JSON.stringify({ projectId, issueId, taskId }))

    const { project, issue, task } = res.app.locals

    if (task) {
      task.reload()
    } else if (issue) {
      issue.reload()
    } else if (project) {
      project.reload()
    } else {
      await req.app.locals.jetBrainsInstance.reload()
    }
  }
  await req.app.locals.jetBrainsInstance.metrics // causes the metrics to be recalculated which will load other needed data

  res.redirect(req.headers.referer || '/')
}