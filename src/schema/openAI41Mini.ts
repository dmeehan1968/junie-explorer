import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities.js"
import { AbstractLLM } from "./abstractLLM.js"

export const OpenAI41Mini = AbstractLLM.extend({
  jbai: z.literal('openai-gpt4.1-mini'),
  capabilities: AbstractCapabilities.optional(),
  isSummarizer: z.boolean().default(() => true),
})