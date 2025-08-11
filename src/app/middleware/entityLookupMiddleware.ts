import { NextFunction } from "express"
import { AppError, AppParams, AppRequest, AppResponse } from "../types.js"

export async function entityLookupMiddleware(req: AppRequest, res: AppResponse, next: NextFunction) {
  try {
    const params = AppParams.parse(req.params)

    req.project = params.projectId && await res.app.locals.jetBrains.getProjectByName(params.projectId) || undefined
    req.issue = params.issueId && await req.project?.getIssueById(params.issueId) || undefined
    req.task = params.taskId && await req.issue?.getTaskById(params.taskId) || undefined

    if (params.projectId && !req.project) {
      return next(new AppError(404, `Project "${params.projectId}" not found`))
    }
    if (params.issueId && !req.issue) {
      return next(new AppError(404, `Issue "${params.issueId}" not found`))
    }
    if (params.taskId && !req.task) {
      return next(new AppError(404, `Task ${params.taskId} not found`))
    }

    next()
  } catch (error) {
    next(error)
  }
}