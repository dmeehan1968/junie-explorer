import { z } from "zod"
import { ToolParamsObject } from "./toolParamsObject.js"

export const ToolParamsArray = z.looseObject({
  ParameterValue: z.string(),
  name: z.string(),
  value: z.any(),
}).array().transform(params => {
  return params.reduce((acc, { name, value }) => {
    acc[name] = value
    return acc
  }, {} as ToolParamsObject)
})
export type ToolParamsArray = z.infer<typeof ToolParamsArray>