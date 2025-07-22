import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import homeRoutes from './routes/homeRoutes.js'
import issueRoutes from './routes/issueRoutes.js'
import notFoundRoutes from './routes/notFoundRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import taskStepsRoute from './routes/taskStepsRoute.js'
import taskStepDataRoute from './routes/taskStepDataRoute.js'
import taskStepRepresentationsRoute from './routes/taskStepRepresentationsRoute.js'
import taskEventsRoute from './routes/taskEventsRoute.js'
import taskTrajectoriesRoute from './routes/taskTrajectoriesRoute.js'
import { JetBrains } from "./jetbrains.js"
import publicFiles from "./bun/public.js"
import mime from 'mime-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface ServerOptions {
  jetBrainsInstance?: JetBrains
  port?: number
  preload?: boolean
}

export function createServer(options: ServerOptions = {}) {
  const {
    jetBrainsInstance = new JetBrains({ logPath: process.env.JETBRAINS_LOG_PATH }),
    port = process.env.PORT || 3000,
    preload = true
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
  app.get('/refresh', (req, res) => {
    jetBrainsInstance.reload()
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
  app.use('/', taskTrajectoriesRoute)

  // Add not found page (must be after routes)
  app.use(notFoundRoutes)

  // Initialize app state if requested
  if (preload) {
    jetBrainsInstance.preload()
  }

  return { app, jetBrainsInstance, port }
}

// Start the server when this file is run directly
const currentFileUrl = import.meta.url
const scriptPath = fileURLToPath(currentFileUrl)
const mainPath = path.resolve(process.argv[1])

if (path.resolve(scriptPath) === mainPath) {
  const { app, port } = createServer()
  const server = app.listen(port, () => {
    const address = server.address()
    if (address === null || typeof address === 'string') {
      throw new Error(`Server failed to start on port ${port} - ${address}`)
    }

    console.log(
        `Server is running on http://localhost:${address.port}`
    )
  })
}