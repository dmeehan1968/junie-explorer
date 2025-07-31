import * as z from "zod"
import { ContentChoice } from "./contentChoice.js"

export const AIToolUseAnswerChoice = ContentChoice.extend({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice'),
  usages: z.object({
    toolId: z.string(),
    toolName: z.string(),
    toolParams: z.object({
      ParameterValue: z.string(),
      name: z.string(),
      value: z.any(),
    }).array().default(() => ([])),
  }).array().default(() => ([])),
})