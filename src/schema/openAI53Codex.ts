import { z } from "zod"
import { OpenAI52 } from "./openAI52"
import { OpenAI52Codex } from "./openAI52Codex"

export const OpenAI53Codex = OpenAI52Codex.extend({
  jbai: z.literal('openai-gpt-5-3-codex'),
})