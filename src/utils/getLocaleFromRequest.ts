import express from "express"
import { AppRequest } from "../app/types"

export function getLocaleFromRequest(req: AppRequest): string | undefined {
  return req.headers['accept-language']?.split(',').map(lang => lang.split(';')[0])[0]
}