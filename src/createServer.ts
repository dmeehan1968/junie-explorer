import express from "express"
import mime from "mime-types"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import publicFiles from "./bun/public.js"
import { JetBrains } from "./jetbrains.js"
import homeRoutes from "./routes/homeRoutes.js"
import issueRoutes from "./routes/issueRoutes.js"
import notFoundRoutes from "./routes/notFoundRoutes.js"
import projectRoutes from "./routes/projectRoutes.js"
import taskEventsRoute from "./routes/taskEventsRoute.js"
import taskDetailsRoute from "./routes/taskDetailsRoute.js"
import taskStepDataRoute from "./routes/taskStepDataRoute.js"
import taskStepRepresentationsRoute from "./routes/taskStepRepresentationsRoute.js"
import taskStepsRoute from "./routes/taskStepsRoute.js"
import taskTrajectoriesRoute from "./routes/taskTrajectoriesRoute.js"

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
    await jetBrainsInstance.reload()
    res.redirect(req.headers.referer || '/')
  })

  // Register routes
  app.use('/', homeRoutes)
  app.use('/', projectRoutes)
  app.use('/', issueRoutes)
  app.use('/', taskStepsRoute)
  app.use('/', taskStepDataRoute)
  app.use('/', taskStepRepresentationsRoute)
  app.use('/', taskEventsRoute)
  app.use('/', taskDetailsRoute)
  app.use('/', taskTrajectoriesRoute)

  // Add not found page (must be after routes)
  app.use(notFoundRoutes)

  // Initialize app state if requested
  if (preload) {
    await jetBrainsInstance.preload()
  }

  return { app, jetBrainsInstance, port }
}