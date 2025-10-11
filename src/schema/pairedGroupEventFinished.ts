import * as z from "zod"

export const PairedGroupEventFinished
  = z.looseObject({
  type: z.literal('PairedGroupEventFinished'),
  // TODO
})