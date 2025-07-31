import * as z from "zod"

export const McpInitStarted = z.looseObject({
  type: z.literal('McpInitStarted'),
  // TODO
})