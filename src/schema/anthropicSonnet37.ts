import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities.js"
import { AbstractLLM } from "./abstractLLM.js"

export const AnthropicSonnet37 = AbstractLLM.extend({
  jbai: z.literal('anthropic-claude-3.7-sonnet'),
  capabilities: AbstractCapabilities.extend({
    maxOutputTokens: z.number(),
    vision: z.object({
      maxDimension: z.number(),
      maxPixels: z.number(),
      maxDimensionDivider: z.number(),
    }).optional(),
    supportsAssistantMessageResuming: z.boolean().default(() => false),
    supportsWebSearch: z.boolean().default(() => false),
    webSearchPrice: z.number().default(() => 0),
  }).optional(),
  isSummarizer: z.boolean().default(() => false)
})