import * as z from "zod"
import { AnthropicSonnet37 } from "./anthropicSonnet37.js"

export const AnthropicSonnet4 = AnthropicSonnet37.extend({
  jbai: z.literal('anthropic-claude-4-sonnet'),
})