import express, { Express, NextFunction, Router } from "express"
import { Server } from "http"
import { JetBrains } from "../jetbrains.js"
import refreshRoutes from "./web/refreshRoutes.js"
import homeRoutes from "../app/web/homeRoutes.js"
import projectRoutes from "../app/web/projectRoutes.js"
import taskEventsRoute from "../app/web/taskEventsRoute.js"
import taskTrajectoriesRoute from "../app/web/taskTrajectoriesRoute.js"
import apiProjects from "./api/projects.js"
import apiTrajectories from "./api/trajectories/index.js"
import apiEvents from "./api/events/index.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { serveStaticsFromBunVfsMiddleware } from "./middleware/serveStaticsFromBunVfsMiddleware.js"
import { AppRequest, AppResponse } from "./types.js"
import { notFoundRouteHandler } from "./web/notFoundRouteHandler.js"

export class JunieExplorer {
  private readonly app: Express

  constructor(public readonly jetBrains: JetBrains) {

    this.app = express()
    this.app.locals.jetBrains = jetBrains   // TODO: remove this

    // middleware
    this.app.use(async (req: AppRequest, res: AppResponse, next: NextFunction) => {
      req.jetBrains = jetBrains
      next()
    })
    this.app.use(serveStaticsFromBunVfsMiddleware)

    // routes
    this.app.use('/', refreshRoutes)
    this.app.use('/', homeRoutes)
    this.app.use('/', projectRoutes)
    this.app.use('/', taskEventsRoute)
    this.app.use('/', taskTrajectoriesRoute)

    this.app.use('/', apiProjects)
    this.app.use('/', apiTrajectories)
    this.app.use('/', apiEvents)

    // error handling
    this.app.use(notFoundRouteHandler)
    this.app.use(errorHandler)

  }

  listen(port: number | string, callback?: (server: Server, host: string, port: number) => void) {
    const server = this.app.listen(port, (...args: any[]) => {
      const [ , host, port ] = args
      callback?.(server, host, port)
    })

    return server
  }
}