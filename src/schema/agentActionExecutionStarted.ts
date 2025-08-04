import { z } from "zod"
import { ToolParams } from "./toolParams.js"

export const AgentActionExecutionStarted = z.looseObject({
  type: z.literal('AgentActionExecutionStarted'),
  actionToExecute: z.looseObject({
    type: z.string(),
    name: z.string(),
    id: z.string().optional(),
    arguments: z.any().optional(),
    inputParams: ToolParams.optional(),
    description: z.string().optional(),
  }).transform(({ arguments: args, inputParams, ...rest }) => ({
    ...rest,
    inputParams: args || inputParams || {},
  })),
})
export type AgentActionExecutionStarted = z.infer<typeof AgentActionExecutionStarted>