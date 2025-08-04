import { z } from "zod"

export const ResponseTextAppeared = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.agent.ResponseTextAppeared'),
  text: z.string(),
})
export type ResponseTextAppeared = z.infer<typeof ResponseTextAppeared>