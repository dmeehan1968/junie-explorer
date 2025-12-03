import * as z from "zod"

export const MemoryCompactedEvent
  = z.looseObject({
  type: z.literal('MemoryCompactedEvent'),
  // TODO
})