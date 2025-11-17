import { z } from "zod"
import { ActionToExecute } from "./actionToExecute"

export const AgentActionExecutionStarted = z.looseObject({
  type: z.literal('AgentActionExecutionStarted'),
  actionToExecute: ActionToExecute,
})
export type AgentActionExecutionStarted = z.infer<typeof AgentActionExecutionStarted>