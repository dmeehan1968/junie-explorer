import * as z from "zod"

export const ContentChoice = z.looseObject({
  content: z.string(),
})