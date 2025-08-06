import express from "express"
import mime from "mime-types"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import publicFiles from "./bun/public.js"
import { Issue } from "./Issue.js"
import { JetBrains } from "./jetbrains.js"
import { Project } from "./Project.js"
import homeRoutes from "./routes/homeRoutes.js"
import issueRoutes from "./routes/issueRoutes.js"
import notFoundRoutes from "./routes/notFoundRoutes.js"
import projectRoutes from "./routes/projectRoutes.js"
import taskEventsRoute from "./routes/taskEventsRoute.js"
import taskTrajectoriesRoute from "./routes/taskTrajectoriesRoute.js"
import { Task } from "./Task.js"

export interface ServerOptions {
  jetBrainsInstance?: JetBrains
  port?: number
  preload?: boolean
}

export async function createServer(options: ServerOptions = {}) {
  const {
    jetBrainsInstance = new JetBrains({ logPath: process.env.JETBRAINS_LOG_PATH }),
    port = process.env.PORT || 3000,
    preload = true,
  } = options

  const app = express()

  // Serve static files
  // app.use(express.static(path.join(__dirname, '../public')))

  // Serve static files from import created by make-vfs
  app.use((req, res, next) => {
    const url = req.url.slice(1)
    if (!(url in publicFiles)) {
      return next()
    }
    const route = publicFiles[url as never]
    const contentType = mime.lookup(url)
    if (!route || !contentType) return next()
    return res.contentType(contentType).send(route)
  })
  app.use((req, res, next) => {
    req.app.locals.jetBrains = jetBrainsInstance
    next()
  })
  // Add refresh endpoint
  app.get('/refresh', async (req, res) => {
    const referer = req.headers.referer
    if (referer) {
      const url = new URL(referer)
      const parts = url.pathname.split('/')
      const projectId = parts[2]
      const issueId = parts[4]
      const taskId = parts[6]

      console.log('Reloading', JSON.stringify({ projectId, issueId, taskId }))

      let project: Project | undefined
      let issue: Issue | undefined
      let task: Task | undefined

      if (projectId) {
        project = await jetBrainsInstance.getProjectByName(projectId)
      }
      if (issueId) {
        issue = await project?.getIssueById(issueId)
      }
      if (taskId) {
        task = await issue?.getTaskById(taskId)
      }

      if (task) {
        task.reload()
      } else if (issue) {
        issue.reload()
      } else if (project) {
        project.reload()
      } else {
        await jetBrainsInstance.reload()
      }
    }
    await jetBrainsInstance.metrics // causes the metrics to be recalculated which will load other needed data

    res.redirect(req.headers.referer || '/')
  })

  // Register routes
  app.use('/', homeRoutes)
  app.use('/', projectRoutes)
  app.use('/', issueRoutes)
  app.use('/', taskEventsRoute)
  app.use('/', taskTrajectoriesRoute)

  // Add not found page (must be after routes)
  app.use(notFoundRoutes)

  // Initialize app state if requested
  if (preload) {
    await jetBrainsInstance.preload()
  }

  return { app, jetBrainsInstance, port }
}