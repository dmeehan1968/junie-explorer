import * as z from "zod"

export const StepSummaryCreatedEvent = z.looseObject({
  type: z.literal('StepSummaryCreatedEvent'),
})