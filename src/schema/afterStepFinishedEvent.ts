import * as z from "zod"

export const AfterStepFinishedEvent = z.looseObject({
  type: z.literal('AfterStepFinishedEvent'),
  // TODO
})