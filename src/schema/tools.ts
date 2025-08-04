import * as z from "zod"
import { ToolAnyProperty } from "./toolAnyProperty.js"
import { ToolArrayProperty } from "./toolArrayProperty.js"

export const Tools = z.looseObject({
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  params: z.union([
    ToolAnyProperty.array().default(() => ([])).transform(params => ({ parameters: ToolAnyProperty.array().parse(params) })),
    z.looseObject({
      parameters: ToolAnyProperty.array().default(() => ([])),
    })]),
}).array().default(() => ([]))