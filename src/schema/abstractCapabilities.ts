import * as z from "zod"

export const AbstractCapabilities = z.looseObject({
  inputPrice: z.number(),
  outputPrice: z.number(),
  cacheInputPrice: z.number().optional(),
  cacheCreateInputPrice: z.number().optional(),
  webSearchPrice: z.number().default(() => 0),
})