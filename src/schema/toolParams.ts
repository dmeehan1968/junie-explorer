import { z } from "zod"
import { ToolParamsArray } from "./toolParamsArray.js"
import { ToolParamsObject } from "./toolParamsObject.js"

export const ToolParams = z.union([
  ToolParamsObject,
  ToolParamsArray,
]).transform((params): { rawJsonObject: Record<string, any> } => {
  if (!('rawJsonObject' in params)) {
    return {
      rawJsonObject: params,
    }
  }
  return params as { rawJsonObject: Record<string, any> }
})
export type ToolParams = z.infer<typeof ToolParams>