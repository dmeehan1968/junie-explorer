import * as z from "zod"

export const UserChatMessageWithToolResults = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults'),
  toolResults: z.looseObject({
    id: z.string(),
    content: z.string(),
    isError: z.boolean(),
  }).array(),
})