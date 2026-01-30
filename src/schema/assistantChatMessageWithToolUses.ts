import * as z from "zod"
import { ToolParams } from "./toolParams"

export const ToolUse = z.union([
  z.object({
    id: z.string(),
    name: z.string(),
    input: ToolParams.optional(),
  }),
  z.object({
    toolCallId: z.object({
      id: z.string(),
      callId: z.string(),
      name: z.string(),
      provider: z.string(),
    }),
    input: z.object({
      rawJsonObject: z.record(z.string(), z.any()),
    }).nullable(),
  }),
]).transform(toolUse => {
  if ('toolCallId' in toolUse) {
    return {
      id: toolUse.toolCallId.id,
      name: toolUse.toolCallId.name,
      input: toolUse.input,
    }
  }
  return toolUse
})

export type ToolUse = z.infer<typeof ToolUse>

export const AssistantChatMessageWithToolUses = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses'),
  content: z.string(),
  toolUses: ToolUse.array(),
  answerChoiceId: z.string().optional(),
  reasoning: z.looseObject({
    type: z.string(),
    id: z.string(),
    encryptedContent: z.string(),
  }).array().optional(),
})
export type AssistantChatMessageWithToolUses = z.infer<typeof AssistantChatMessageWithToolUses>