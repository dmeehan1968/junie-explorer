import express from "express"

export function getLocaleFromRequest(req: express.Request): string | undefined {
  return req.headers['accept-language']?.split(',').map(lang => lang.split(';')[0])[0]
}