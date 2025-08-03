import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities.js"
import { AbstractLLM } from "./abstractLLM.js"

export const OpenAIo3 = AbstractLLM.extend({
  jbai: z.literal('openai-o3'),
  capabilities: AbstractCapabilities.optional(),
  isSummarizer: z.boolean().default(() => true),
})