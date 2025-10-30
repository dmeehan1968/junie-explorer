import * as z from "zod"
import { ActionToExecute } from "./actionToExecute.js"

export const AgentActionExecutionFinished = z.looseObject({
  type: z.literal('AgentActionExecutionFinished'),
  actionToExecute: ActionToExecute,
  /**
   * Note that regardless of received result, the output is always an object with the following shape:
   * interface { text: string; images?: string[]; }
   */
  result: z.union([
    z.looseObject({
      text: z.string(),
      images: z.any().array().optional(),
    }),
    z.looseObject({
      content: z.string(),
    }).transform(result => ({ text: result.content })),
    z.string().transform(result => ({ text: result })),
  ]),
})
export type AgentActionExecutionFinished = z.infer<typeof AgentActionExecutionFinished>