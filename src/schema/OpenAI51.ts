import { z } from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const OpenAI51 = AbstractLLM.extend({
  jbai: z.literal('openai-gpt-5-1'),
  capabilities: AbstractCapabilities,
})