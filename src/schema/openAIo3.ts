import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const OpenAIo3 = AbstractLLM.extend({
  jbai: z.literal('openai-o3'),
  provider: z.literal('OpenAI'),
  capabilities: AbstractCapabilities.optional(),
  isSummarizer: z.boolean().default(() => true),
})