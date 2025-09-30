import * as z from "zod"
import { AnthropicSonnet37 } from "./anthropicSonnet37.js"

export const AnthropicSonnet45 = AnthropicSonnet37.extend({
  jbai: z.literal('anthropic-claude-4-5-sonnet'),
})