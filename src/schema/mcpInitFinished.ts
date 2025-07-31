import * as z from "zod"

export const McpInitFinished = z.looseObject({
  type: z.literal('McpInitFinished'),
  // TODO
})