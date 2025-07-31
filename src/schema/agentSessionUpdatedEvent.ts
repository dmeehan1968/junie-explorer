import * as z from "zod"

export const AgentSessionUpdatedEvent = z.looseObject({
  type: z.literal('AgentSessionUpdatedEvent'),
  // TODO
})