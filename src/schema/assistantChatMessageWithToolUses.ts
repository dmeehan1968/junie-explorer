import * as z from "zod"

export const AssistantChatMessageWithToolUses = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses'),
  content: z.string(),
  toolUses: z.looseObject({
    id: z.string(),
    name: z.string(),
    input: z.object({
      ParameterValue: z.string(),
      name: z.string(),
      value: z.any(),
    }).array(),
  }).array(),
})