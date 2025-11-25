import { z } from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const Gemini3Pro = AbstractLLM.extend({
  jbai: z.literal('google-gemini-3-0-pro'),
  provider: z.literal('Google'),
  capabilities: AbstractCapabilities,
})