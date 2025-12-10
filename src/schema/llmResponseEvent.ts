import * as z from "zod"
import { AIContentAnswerChoice } from "./AIContentAnswerChoice"
import { AIToolUseAnswerChoice } from "./AIToolUseAnswerChoice"
import { LLM } from "./LLM"
import { LlmRequestEvent } from "./llmRequestEvent"

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
    cost: z.number().optional(),
    usage: z.looseObject({
      inputTokens: z.number().int().optional(),
      outputTokens: z.number().int().optional(),
      cacheInputTokens: z.number().int().optional(),
      cacheCreateInputTokens: z.number().int().optional(),
      webSearchCount: z.number().int().optional(),
    }).nullish().transform(v => v ?? {}),
  }).transform(({ inputTokens = 0, outputTokens = 0, cacheInputTokens = 0, cacheCreateInputTokens = 0, webSearchCount = 0, ...answer }) => {
    const million = 1_000_000

    // NB: Junie in AIA no longer outputs token metrics

    webSearchCount ||= answer.usage.webSearchCount || 0

    const inputTokenCost = (inputTokens / million) * answer.llm.capabilities.inputPrice
    const outputTokenCost = (outputTokens / million) * answer.llm.capabilities.outputPrice
    const cacheInputTokenCost = (cacheInputTokens / million) * answer.llm.capabilities.cacheInputPrice
    const cacheCreateInputTokenCost = (cacheCreateInputTokens / million) * answer.llm.capabilities.cacheCreateInputPrice
    const webSearchCost = (webSearchCount / million) * answer.llm.capabilities.webSearchPrice

    const cost = inputTokenCost
      + outputTokenCost
      + cacheInputTokenCost
      + cacheCreateInputTokenCost
      + webSearchCost

    return {
      ...answer,
      // if our calculated cost is non-zero, use that, otherwise use Junie's.
      cost: cost ? cost : answer.cost ?? 0,
      inputTokens,
      inputTokenCost,
      outputTokens,
      outputTokenCost,
      cacheInputTokens,
      cacheInputTokenCost,
      cacheCreateInputTokens,
      cacheCreateInputTokenCost,
      webSearchCount,
      webSearchCost,
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
  requestEvent: LlmRequestEvent.optional(),   // will be filled in later
})
export type LlmResponseEvent = z.infer<typeof LlmResponseEvent>

export const isResponseEvent = (event: any): event is LlmResponseEvent => {
  if (event === null || typeof event !== 'object') return false
  return event.type === 'LlmResponseEvent'
}
