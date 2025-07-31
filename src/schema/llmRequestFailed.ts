import * as z from "zod"

export const LlmRequestFailed = z.looseObject({
  type: z.literal('LlmRequestFailed'),
  // TODO
})