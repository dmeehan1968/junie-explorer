import * as z from "zod"

export const AbstractLLM = z.looseObject({
  isSummarizer: z.boolean().default(() => false),
  provider: z.string(),
  name: z.string(),
  inputPrice: z.number().optional(),              // deprecated
  outputPrice: z.number().optional(),             // deprecated
  cacheInputPrice: z.number().optional(),         // deprecated
  cacheCreateInputPrice: z.number().optional(),   // deprecated
})