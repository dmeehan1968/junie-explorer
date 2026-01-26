import * as z from "zod"
import { ToolParams } from "./toolParams"

const ToolResults = z.union([
  z.object({
    id: z.string(),
    content: z.string(),
    isError: z.boolean(),
  }),
  z.object({
    toolCallId: z.object({
      id: z.string(),
      callId: z.string(),
      name: z.string(),
      provider: z.string(),
    }),
    content: z.string(),
    isError: z.boolean(),
    images: z.any().array(),
  }),
]).transform(toolUse => {
  if ('toolCallId' in toolUse) {
    return {
      id: toolUse.toolCallId.id,
      content: toolUse.content,
      isError: toolUse.isError,
    }
  }
  return toolUse
})

export const UserChatMessageWithToolResults = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults'),
  toolResults: ToolResults.array(),
})