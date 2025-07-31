import * as z from "zod"

export const AbstractToolProperty = z.looseObject({
  name: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(() => false),
})