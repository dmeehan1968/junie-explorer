import * as z from "zod"
import { AIContentAnswerChoice } from "./AIContentAnswerChoice.js"
import { AIToolUseAnswerChoice } from "./AIToolUseAnswerChoice.js"
import { LLM } from "./LLM.js"

export const LlmResponseEvent = z.looseObject({
  type: z.literal('LlmResponseEvent'),
  id: z.string(),
  answer: z.looseObject({
    llm: LLM,
    contentChoices: z.discriminatedUnion('type', [AIContentAnswerChoice, AIToolUseAnswerChoice]).array(),
    inputTokens: z.number().int().default(() => 0),
    outputTokens: z.number().int().default(() => 0),
    cacheInputTokens: z.number().int().default(() => 0),
    cacheCreateInputTokens: z.number().int().default(() => 0),
    time: z.number().optional(),
  }).transform(answer => {
    const million = 1_000_000
    return {
      ...answer,
      cost: (answer.inputTokens / million) * (answer.llm?.capabilities?.inputPrice ?? answer.llm?.inputPrice ?? 0)
        + (answer.outputTokens / million) * (answer.llm?.capabilities?.outputPrice ?? answer.llm?.outputPrice ?? 0)
        + (answer.cacheInputTokens / million) * (answer.llm?.capabilities?.cacheInputPrice ?? answer.llm?.cacheInputPrice ?? 0)
        + (answer.cacheCreateInputTokens / million) * (answer.llm?.capabilities?.cacheCreateInputPrice ?? answer.llm?.cacheCreateInputPrice ?? 0),
    }
  }),
})