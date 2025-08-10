import * as z from "zod"
import { ActionToExecute } from "./actionToExecute.js"

export const AgentActionExecutionFinished = z.looseObject({
  type: z.literal('AgentActionExecutionFinished'),
  actionToExecute: ActionToExecute,
  result: z.union([
    z.looseObject({
      text: z.string(),
      images: z.any().array().optional(),
    }),
    z.string()
  ]).transform(result => {
    if (typeof result === 'string') {
      return { text: result }
    }
    return result
  }),
})
export type AgentActionExecutionFinished = z.infer<typeof AgentActionExecutionFinished>