import * as z from "zod"
import { ToolParams } from "./toolParams"

export const LegacyToolResult = z.object({
  id: z.string(),
  content: z.string(),
  isError: z.boolean(),
})

export const ToolResult = z.object({
  toolCallId: z.object({
    id: z.string(),
    callId: z.string(),
    name: z.string(),
    provider: z.string(),
  }),
  content: z.string(),
  isError: z.boolean(),
  images: z.any().array(),
})

const ToolResults = z.union([
  LegacyToolResult,
  ToolResult,
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

export const TextMessagePart = z.looseObject({
  type: z.literal('text'),
  text: z.string(),
})

export const ToolResultPart = z.looseObject({
  type: z.literal('toolResult'),
  toolResult: ToolResult,
})

export const MessagePart = z.union([
  TextMessagePart,
  ToolResultPart,
])

export const UserChatMessage = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessage'),
  parts: MessagePart.array(),
})