import * as z from "zod"

export const LongDelayDetected = z.looseObject({
  type: z.literal('LongDelayDetected'),
})