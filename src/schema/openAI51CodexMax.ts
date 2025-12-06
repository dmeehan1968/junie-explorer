import { z } from "zod"
import { AbstractCapabilities } from "./abstractCapabilities"
import { AbstractLLM } from "./abstractLLM"
import { OpenAI51 } from "./openAI51"

export const OpenAI51CodexMax = OpenAI51.extend({
  jbai: z.literal('openai-gpt-5-1-codex-max'),
})