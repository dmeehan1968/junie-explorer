import * as z from "zod"
import { AIContentAnswerChoice } from "./AIContentAnswerChoice"
import { AIToolUseAnswerChoice } from "./AIToolUseAnswerChoice"
import { LLM } from "./LLM"

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
    webSearchCount: z.number().int().optional(),
    time: z.number().optional(),
    cached: z.boolean().default(() => false),
    usage: z.looseObject({
      inputTokens: z.number().int().optional(),
      outputTokens: z.number().int().optional(),
      cacheInputTokens: z.number().int().optional(),
      cacheCreateInputTokens: z.number().int().optional(),
      webSearchCount: z.number().int().optional(),
    }).default(() => ({})),
  }).transform(({ inputTokens = 0, outputTokens = 0, cacheInputTokens = 0, cacheCreateInputTokens = 0, webSearchCount = 0, ...answer }) => {
    const million = 1_000_000

    webSearchCount ||= answer.usage.webSearchCount || 0

    const cost = (inputTokens / million) * answer.llm.capabilities.inputPrice
      + (outputTokens / million) * answer.llm.capabilities.outputPrice
      + (cacheInputTokens / million) * answer.llm.capabilities.cacheInputPrice
      + (cacheCreateInputTokens / million) * answer.llm.capabilities.cacheCreateInputPrice
      + webSearchCount * answer.llm.capabilities.webSearchPrice

    return {
      ...answer,
      cost,
      inputTokens,
      outputTokens,
      cacheInputTokens,
      cacheCreateInputTokens,
      webSearchCount,
      time: answer.time ?? 0,
      metricCount: [
        inputTokens,
        outputTokens,
        cacheInputTokens,
        cacheCreateInputTokens,
        webSearchCount,
      ].filter(v => v !== undefined).length,
    }
  }),
})
export type LlmResponseEvent = z.infer<typeof LlmResponseEvent>