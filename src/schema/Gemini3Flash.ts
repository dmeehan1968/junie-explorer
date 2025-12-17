import { z } from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"

export const Gemini3Flash = AbstractLLM.extend({
  jbai: z.literal('google-gemini-3-0-flash'),
  provider: z.literal('Google'),
  capabilities: AbstractCapabilities,
})