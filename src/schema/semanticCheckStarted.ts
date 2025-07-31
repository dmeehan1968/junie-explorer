import * as z from "zod"

export const SemanticCheckStarted = z.looseObject({
  type: z.literal('SemanticCheckStarted'),
  // TODO
})