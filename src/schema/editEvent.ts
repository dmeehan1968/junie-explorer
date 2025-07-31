import * as z from "zod"

export const EditEvent = z.looseObject({
  type: z.literal('EditEvent'),
  // TODO
})