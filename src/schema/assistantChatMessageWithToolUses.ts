import * as z from "zod"
import { ToolParams } from "./toolParams"

export const ToolUse = z.looseObject({
  id: z.string(),
  name: z.string(),
  input: ToolParams.optional(),
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