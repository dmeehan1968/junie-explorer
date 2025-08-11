import { NextFunction } from "express"
import mime from "mime-types"
import publicFiles from "../../bun/public.js"
import { AppRequest, AppResponse } from "../types.js"

/**
 * Serve static files from import created by make-vfs
 */
export function serveStaticsFromBunVfsMiddleware(req: AppRequest, res: AppResponse, next: NextFunction) {
  const url = req.url.slice(1)
  if (!(url in publicFiles)) {
    return next()
  }
  const route = publicFiles[url as never]
  const contentType = mime.lookup(url)
  if (!route || !contentType) return next()
  return res.contentType(contentType).send(route)
}