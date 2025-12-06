import { z } from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const OpenAI51CodexMax = AbstractLLM.extend({
  jbai: z.literal('openai-gpt-5-1-codex-max'),
  provider: z.literal('OpenAI'),
  capabilities: AbstractCapabilities,
})