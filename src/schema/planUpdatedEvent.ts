import * as z from "zod"

export const PlanUpdatedEvent = z.looseObject({
  type: z.literal('PlanUpdatedEvent'),
  plan: z.looseObject({
    description: z.string(),
    status: z.string(),
  }).array(),
})