import express, { Express, NextFunction, Router } from "express"
import { Server } from "http"
import { JetBrains } from "../jetbrains"
import refreshRoutes from "./web/refreshRoutes"
import homeRoutes from "../app/web/homeRoutes"
import projectRoutes from "../app/web/projectRoutes"
import taskEventsRoute from "../app/web/taskEventsRoute"
import taskTrajectoriesRoute from "../app/web/taskTrajectoriesRoute"
import statsRoute from "../app/web/statsRoute"
import apiProjects from "./api/projects"
import apiTrajectories from "./api/trajectories/index"
import apiEvents from "./api/events/index"
import apiStats from "./api/stats"
import apiSearch from "./api/search"
import apiIssues from "./api/issues"
import { errorHandler } from "./middleware/errorHandler"
import { serveStaticsFromBunVfsMiddleware } from "./middleware/serveStaticsFromBunVfsMiddleware"
import { AppRequest, AppResponse } from "./types"
import { notFoundRouteHandler } from "./web/notFoundRouteHandler"
import cookieParser from 'cookie-parser'

export class JunieExplorer {
  private readonly app: Express

  constructor(
    public readonly jetBrains: JetBrains
  ) {

    this.app = express()

    // middleware
    this.app.use(cookieParser())
    this.app.use(express.json())
    // this.app.use(express.static('public'))
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
    this.app.use('/', statsRoute)

    this.app.use('/', apiProjects)
    this.app.use('/', apiTrajectories)
    this.app.use('/', apiEvents)
    this.app.use('/', apiStats)
    this.app.use('/', apiSearch)
    this.app.use('/', apiIssues)

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