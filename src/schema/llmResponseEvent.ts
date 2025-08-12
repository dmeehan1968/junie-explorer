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
    contentChoices: ContentAnswer.array(),
    inputTokens: z.number().int().optional(),
    outputTokens: z.number().int().optional(),
    cacheInputTokens: z.number().int().optional(),
    cacheCreateInputTokens: z.number().int().optional(),
    time: z.number().optional(),
  }).transform(answer => {
    const million = 1_000_000

    const cost = ((answer.inputTokens ?? 0) / million) * (answer.llm?.capabilities?.inputPrice ?? answer.llm?.inputPrice ?? 0)
      + ((answer.outputTokens ?? 0) / million) * (answer.llm?.capabilities?.outputPrice ?? answer.llm?.outputPrice ?? 0)
      + ((answer.cacheInputTokens ?? 0) / million) * (answer.llm?.capabilities?.cacheInputPrice ?? answer.llm?.cacheInputPrice ?? 0)
      + ((answer.cacheCreateInputTokens ?? 0) / million) * (answer.llm?.capabilities?.cacheCreateInputPrice ?? answer.llm?.cacheCreateInputPrice ?? 0)

    return {
      ...answer,
      cost,
      inputTokens: answer.inputTokens ?? 0,
      outputTokens: answer.outputTokens ?? 0,
      cacheInputTokens: answer.cacheInputTokens ?? 0,
      cacheCreateInputTokens: answer.cacheCreateInputTokens ?? 0,
      time: answer.time ?? 0,
      metricCount: [
        answer.inputTokens,
        answer.outputTokens,
        answer.cacheInputTokens,
        answer.cacheCreateInputTokens
      ].filter(v => v !== undefined).length,
    }
  }),
})
export type LlmResponseEvent = z.infer<typeof LlmResponseEvent>