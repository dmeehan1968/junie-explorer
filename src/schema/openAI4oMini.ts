import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities.js"
import { AbstractLLM } from "./abstractLLM.js"

export const OpenAI4oMini = AbstractLLM.extend({
  jbai: z.literal('openai-gpt-4o-mini'),
  capabilities: AbstractCapabilities.optional(),
  isSummarizer: z.boolean().default(() => true)
})