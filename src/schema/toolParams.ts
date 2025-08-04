import { z } from "zod"
import { ToolParamsArray } from "./toolParamsArray.js"
import { ToolParamsObject } from "./toolParamsObject.js"

export const ToolParams = z.union([ToolParamsObject, ToolParamsArray])
export type ToolParams = z.infer<typeof ToolParams>