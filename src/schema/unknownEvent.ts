import * as z from "zod"

export const UnknownEvent = z.looseObject({
  type: z.string(),
})