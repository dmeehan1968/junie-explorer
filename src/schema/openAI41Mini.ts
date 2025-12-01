import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const OpenAI41Mini = AbstractLLM.extend({
  jbai: z.literal('openai-gpt4.1-mini'),
  provider: z.literal('OpenAI'),
  capabilities: AbstractCapabilities.optional(),
})