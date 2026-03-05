import { z } from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"
import { Gemini3Flash } from "./Gemini3Flash"

export const Gemini31FlashLite = Gemini3Flash.extend({
  jbai: z.literal('google-gemini-3-1-flash-lite'),
  provider: z.literal('Google'),
  capabilities: AbstractCapabilities,
})