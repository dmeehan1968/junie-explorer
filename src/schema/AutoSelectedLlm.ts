import * as z from "zod"
import { AbstractCapabilities } from "./abstractCapabilities.js"
import { AbstractLLM } from "./abstractLLM.js"

export const AutoSelectedLlm = AbstractLLM.extend({
  jbai: z.literal('<UNKNOWN>'),
  capabilities: AbstractCapabilities,
})