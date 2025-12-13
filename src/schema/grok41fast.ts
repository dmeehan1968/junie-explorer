import { z } from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"
import { OpenAI51 } from "./openAI51"

export const Grok41Fast = AbstractLLM.extend({
  jbai: z.literal("xai-grok-4-1-fast"),
  provider: z.literal("XAI"),
  capabilities: AbstractCapabilities,
})
