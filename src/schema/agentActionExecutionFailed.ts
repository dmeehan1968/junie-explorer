import * as z from "zod"
import { AgentActionExecutionStarted } from "./agentActionExecutionStarted.js"

export const AgentActionExecutionFailed = AgentActionExecutionStarted.extend({
  type: z.literal('AgentActionExecutionFailed'),
  result: z.looseObject({
    text: z.string(),
    images: z.any().array(),
  }).optional(),
})