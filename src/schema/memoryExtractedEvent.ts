import * as z from "zod"

export const MemoryExtractedEvent
  = z.looseObject({
  type: z.literal('MemoryExtractedEvent'),
  // TODO
})