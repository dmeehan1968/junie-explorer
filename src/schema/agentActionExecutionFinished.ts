import * as z from "zod"

export const AgentActionExecutionFinished = z.looseObject({
  type: z.literal('AgentActionExecutionFinished'),
  // TODO
})
export type AgentActionExecutionFinished = z.infer<typeof AgentActionExecutionFinished>