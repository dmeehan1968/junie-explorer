import * as z from "zod"

export const SemanticCheckFinished = z.looseObject({
  type: z.literal('SemanticCheckFinished'),
  // TODO
})