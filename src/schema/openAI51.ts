import { z } from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"
import { OpenAI5 } from "./openAI5"

export const OpenAI51 = OpenAI5.extend({
  jbai: z.literal('openai-gpt-5-1'),
})