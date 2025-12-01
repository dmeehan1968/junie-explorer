import * as z from "zod"

export const MemoryReflectionCompletedEvent
  = z.looseObject({
  type: z.literal('MemoryReflectionCompletedEvent'),
  // TODO
})