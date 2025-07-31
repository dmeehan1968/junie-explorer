import * as z from "zod"

export const ErrorCheckerStarted = z.looseObject({
  type: z.literal('ErrorCheckerStarted'),
  // TODO
})