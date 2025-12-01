import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const OpenAI4oMini = AbstractLLM.extend({
  jbai: z.literal('openai-gpt-4o-mini'),
  provider: z.literal('OpenAI'),
  capabilities: AbstractCapabilities.optional(),
})

