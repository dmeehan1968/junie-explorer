import * as z from "zod"

export const TaskResultCreatedEvent = z.looseObject({
  type: z.literal('TaskResultCreatedEvent'),
  // TODO
})