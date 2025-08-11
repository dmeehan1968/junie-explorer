import { Request, Response } from "express"
import * as core from "express-serve-static-core"
import { z } from "zod"
import { Issue } from "../Issue.js"
import { JetBrains } from "../jetbrains.js"
import { Project } from "../Project.js"
import { Task } from "../Task.js"

interface AppLocals {
  jetBrains: JetBrains
}

export const AppParams = z.looseObject({
  projectId: z.string().min(1).optional(),
  issueId: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
})
type AppParams = z.infer<typeof AppParams>

interface AppReqBody {
}

interface AppResBody {
}

export type AppRequest = Request<AppParams, AppReqBody, AppResBody, core.Query, AppLocals> & {
  project?: Project
  issue?: Issue
  task?: Task
}
export type AppResponse = Response<AppResBody, AppLocals>

export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}