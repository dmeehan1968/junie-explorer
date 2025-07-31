import * as z from "zod"

export const ErrorCheckerFinished = z.looseObject({
  type: z.literal('ErrorCheckerFinished'),
  // TODO
})