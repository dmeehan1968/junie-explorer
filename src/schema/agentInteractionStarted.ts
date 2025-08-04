import { z } from "zod"

export const AgentInteractionStarted = z.looseObject({
  type: z.literal('AgentInteractionStarted'),
  interaction: z.looseObject({
    interactionId: z.looseObject({
      id: z.string(),
    }),
    runCancelableInteraction: z.looseObject({
      name: z.string(),
    }).optional(),
    askInteraction: z.object({
      question: z.string(),
    }).optional(),
  }),
})
export type AgentInteractionStarted = z.infer<typeof AgentInteractionStarted>