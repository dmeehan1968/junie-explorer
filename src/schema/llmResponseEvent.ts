import * as z from "zod"
import { AIContentAnswerChoice } from "./AIContentAnswerChoice.js"
import { AIToolUseAnswerChoice } from "./AIToolUseAnswerChoice.js"
import { LLM } from "./LLM.js"

export const ContentAnswer = z.discriminatedUnion('type', [AIContentAnswerChoice, AIToolUseAnswerChoice])
export type ContentAnswer = z.infer<typeof ContentAnswer>

export const LlmResponseEvent = z.looseObject({
  type: z.literal('LlmResponseEvent'),
  id: z.string(),
  answer: z.looseObject({
    llm: LLM,
    contentChoices: ContentAnswer.array().default(() => ([])),
    inputTokens: z.number().int().optional(),
    outputTokens: z.number().int().optional(),
    cacheInputTokens: z.number().int().optional(),
    cacheCreateInputTokens: z.number().int().optional(),
    time: z.number().optional(),
  }).transform(({ inputTokens = 0, outputTokens = 0, cacheInputTokens = 0, cacheCreateInputTokens = 0,  ...answer }) => {
    const million = 1_000_000

    const cost = (inputTokens / million) * answer.llm.capabilities.inputPrice
      + (outputTokens / million) * answer.llm.capabilities.outputPrice
      + (cacheInputTokens / million) * answer.llm.capabilities.cacheInputPrice
      + (cacheCreateInputTokens / million) * answer.llm.capabilities.cacheCreateInputPrice

    return {
      ...answer,
      cost,
      inputTokens,
      outputTokens,
      cacheInputTokens,
      cacheCreateInputTokens,
      time: answer.time ?? 0,
      metricCount: [
        inputTokens,
        outputTokens,
        cacheInputTokens,
        cacheCreateInputTokens,
      ].filter(v => v !== undefined).length,
    }
  }),
})
export type LlmResponseEvent = z.infer<typeof LlmResponseEvent>