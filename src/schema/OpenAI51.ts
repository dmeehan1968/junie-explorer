import { z } from "zod"
import { AbstractCapabilities } from "./abstractCapabilities.js"
import { AbstractLLM } from "./abstractLLM.js"

export const OpenAI51 = AbstractLLM.extend({
  jbai: z.literal('openai-gpt-5-1'),
  capabilities: AbstractCapabilities,
})