import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const AutoSelectedLlm = AbstractLLM.extend({
  jbai: z.enum(['<UNKNOWN>', 'Grazie_model_1', 'openai-gpt-5']),
  capabilities: AbstractCapabilities,
})

