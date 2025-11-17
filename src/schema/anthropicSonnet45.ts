import * as z from "zod"
import { AnthropicSonnet4 } from "./anthropicSonnet4"

export const AnthropicSonnet45 = AnthropicSonnet4.extend({
  jbai: z.literal('anthropic-claude-4-5-sonnet'),
})