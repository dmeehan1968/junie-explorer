import { z } from "zod"
import { OpenAI52 } from "./openAI52"

export const OpenAI54 = OpenAI52.extend({
  jbai: z.literal("openai-gpt-5-4"),
})
