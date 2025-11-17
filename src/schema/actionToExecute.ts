import { z } from "zod"
import { ToolParams } from "./toolParams"

export const ActionToExecute = z.looseObject({
  type: z.string(),
  name: z.string(),
  id: z.string().optional(),
  arguments: z.any().optional(),
  inputParams: ToolParams.optional(),
  description: z.string().optional(),
  thought: z.string().optional(),
  content: z.string().optional(),
}).transform(({ arguments: args, inputParams, ...rest }) => ({
  ...rest,
  inputParams: args || inputParams || {},
}))
export type ActionToExecute = z.infer<typeof ActionToExecute>