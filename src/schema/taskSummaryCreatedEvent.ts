import * as z from "zod"

export const TaskSummaryCreatedEvent = z.looseObject({
  type: z.literal('TaskSummaryCreatedEvent'),
  taskSummary: z.string(),
})