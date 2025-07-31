import * as z from "zod"

export const TaskReportCreatedEvent = z.looseObject({
  type: z.literal('TaskReportCreatedEvent'),
  // TODO
})