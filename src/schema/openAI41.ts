import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities.js"
import { AbstractLLM } from "./abstractLLM.js"

export const OpenAI41 = AbstractLLM.extend({
  jbai: z.literal('openai-gpt4.1'),
  capabilities: AbstractCapabilities.optional(),
})