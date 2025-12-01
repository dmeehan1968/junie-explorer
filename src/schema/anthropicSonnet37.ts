import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const AnthropicSonnet37 = AbstractLLM.extend({
  jbai: z.literal('anthropic-claude-3.7-sonnet'),
  provider: z.literal('Anthropic'),
  capabilities: AbstractCapabilities.extend({
    maxOutputTokens: z.number(),
    vision: z.object({
      maxDimension: z.number(),
      maxPixels: z.number(),
      maxDimensionDivider: z.number(),
    }).optional(),
    supportsAssistantMessageResuming: z.boolean().default(() => false),
    supportsWebSearch: z.boolean().default(() => false),
  }).optional(),
})