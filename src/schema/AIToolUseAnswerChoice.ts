import * as z from "zod"
import { ContentChoice } from "./contentChoice.js"
import { ToolParams } from "./toolParams.js"

export const AIToolUseAnswerChoice = ContentChoice.extend({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice'),
  usages: z.object({
    toolId: z.string().nullable(),
    toolName: z.string(),
    toolParams: ToolParams,
  }).array().default(() => ([])),
})