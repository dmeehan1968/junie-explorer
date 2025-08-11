import { NextFunction } from "express"
import { AppError, AppRequest, AppResponse } from "../types.js"

export function notFoundRouteHandler(_req: AppRequest, _res: AppResponse, next: NextFunction) {
  next(new AppError(404, 'Not Found'))
}