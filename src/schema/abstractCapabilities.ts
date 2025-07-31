import * as z from "zod"

export const AbstractCapabilities = z.looseObject({
  inputPrice: z.number(),
  outputPrice: z.number(),
  cacheInputPrice: z.number().default(() => 0),
  cacheCreateInputPrice: z.number().default(() => 0),
})