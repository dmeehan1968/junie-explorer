import * as z from "zod"

export const BeforeStepStartedEvent = z.looseObject({
  type: z.literal('BeforeStepStartedEvent'),
  // TODO
})