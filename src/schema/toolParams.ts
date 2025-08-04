import { z } from "zod"
import { ToolParamsArray } from "./toolParamsArray.js"
import { ToolParamsObject } from "./toolParamsObject.js"

export const ToolParams = z.union([
  ToolParamsObject,
  ToolParamsArray,
]).transform(params => {
  if (!('rawJsonObject' in params)) {
    return {
      rawJsonObject: params,
    }
  }
  return params
})
export type ToolParams = z.infer<typeof ToolParams>