import * as z from "zod"

export const ChatMessage = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage'),
  content: z.string(),
  kind: z.enum(['User', 'Assistant']).optional(),
})