import { z } from "zod"
import { OpenAI51 } from "./openAI51"

export const OpenAI52 = OpenAI51.extend({
  jbai: z.literal("openai-gpt-5-2"),
})
