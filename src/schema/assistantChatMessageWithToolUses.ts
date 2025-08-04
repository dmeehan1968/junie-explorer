import * as z from "zod"
import { ToolParams } from "./toolParams.js"

export const AssistantChatMessageWithToolUses = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses'),
  content: z.string(),
  toolUses: z.looseObject({
    id: z.string(),
    name: z.string(),
    input: ToolParams,
  }).array(),
})