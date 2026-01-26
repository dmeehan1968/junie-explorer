import { z } from "zod"
import { ToolParams } from "./toolParams"

export const ToolCallId = z.looseObject({
  id: z.string(),
  callId: z.string(),
  name: z.string(),
})

export const ActionToExecute = z.looseObject({
  type: z.string(),
  name: z.string().optional(),
  id: z.string().optional(),
  arguments: z.any().optional(),
  inputParams: ToolParams.optional(),
  description: z.string().optional(),
  thought: z.string().optional(),
  content: z.string().optional(),
  toolCallId: ToolCallId.optional(),
}).transform(({ arguments: args, inputParams, ...rest }) => ({
  ...rest,
  inputParams: args || inputParams || {},
  name: rest.name ?? rest.toolCallId?.name ?? 'Unnamed',
}))
export type ActionToExecute = z.infer<typeof ActionToExecute>