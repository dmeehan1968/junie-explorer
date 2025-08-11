import express, { Express } from "express"
import { Server } from "http"
import { JetBrains } from "../jetbrains.js"
import homeRoutes from "../routes/homeRoutes.js"
import projectRoutes from "../routes/projectRoutes.js"
import taskEventsRoute from "../routes/taskEventsRoute.js"
import taskTrajectoriesRoute from "../routes/taskTrajectoriesRoute.js"
import { entityLookupMiddleware } from "./middleware/entityLookupMiddleware.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { serveStaticsFromBunVfsMiddleware } from "./middleware/serveStaticsFromBunVfsMiddleware.js"
import { notFoundRouteHandler } from "./web/notFoundRouteHandler.js"
import { refreshHandler } from "./web/refreshHandler.js"

export class JunieExplorer {
  private readonly app: Express

  constructor(public readonly jetBrains: JetBrains) {

    this.app = express()
    this.app.locals.jetBrains = jetBrains

    // middleware
    this.app.use(serveStaticsFromBunVfsMiddleware)
    this.app.use(entityLookupMiddleware)

    // routes
    this.app.get('/refresh', refreshHandler)
    this.app.use('/', homeRoutes)
    this.app.use('/', projectRoutes)
    this.app.use('/', taskEventsRoute)
    this.app.use('/', taskTrajectoriesRoute)

    // error handling
    this.app.use(notFoundRouteHandler)
    this.app.use(errorHandler)

  }

  listen(port: number | string, callback: (server: Server, host: string, port: number) => void) {
    const server = this.app.listen(port, (...args: any[]) => {
      const [ , host, port ] = args
      callback(server, host, port)
    })
  }
}