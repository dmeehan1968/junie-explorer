import * as z from "zod"

export const TaskResultCreatedEvent = z.looseObject({
  type: z.literal('TaskResultCreatedEvent'),
  // TODO
  taskResult: z.looseObject({
    state: z.looseObject({
      isFinished: z.boolean().default(false),
    }),
  })
})