import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const openAI5 = AbstractLLM.extend({
  jbai: z.enum(['<UNKNOWN>', 'Grazie_model_1', 'openai-gpt-5']),
  provider: z.literal('OpenAI'),
  capabilities: AbstractCapabilities,
})

