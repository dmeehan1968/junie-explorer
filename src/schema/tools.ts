import * as z from "zod"
import { ToolAnyProperty } from "./toolAnyProperty.js"

export const Tools = z.looseObject({
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  params: ToolAnyProperty.array().default(() => ([])),
}).array().default(() => ([]))