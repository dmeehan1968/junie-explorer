import { z } from "zod"

export const AgentInteractionFinished = z.looseObject({
  type: z.literal('AgentInteractionFinished'),
  interactionId: z.looseObject({
    id: z.string(),
  }).optional(),
})
export type AgentInteractionFinished = z.infer<typeof AgentInteractionFinished>