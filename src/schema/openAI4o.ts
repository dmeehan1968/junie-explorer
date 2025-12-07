import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const OpenAI4o = AbstractLLM.extend({
  jbai: z.literal('openai-gpt-4o'),
  provider: z.literal('OpenAI'),
  capabilities: AbstractCapabilities.optional(),
})

