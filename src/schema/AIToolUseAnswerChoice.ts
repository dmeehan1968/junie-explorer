import * as z from "zod"
import { ContentChoice } from "./contentChoice.js"
import { ToolParams } from "./toolParams.js"

export const ToolUseAnswer = z.object({
  toolId: z.string().nullable(),
  toolName: z.string(),
  toolParams: ToolParams,
})
export type ToolUseAnswer = z.infer<typeof ToolUseAnswer>

export const AIToolUseAnswerChoice = ContentChoice.extend({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice'),
  usages: ToolUseAnswer.array().default(() => ([])),
})
export type AIToolUseAnswerChoice = z.infer<typeof AIToolUseAnswerChoice>