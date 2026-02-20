import * as z from "zod"
import { AnthropicSonnet45 } from "./anthropicSonnet45"

export const AnthropicSonnet46 = AnthropicSonnet45.extend({
  jbai: z.literal('anthropic-claude-4-6-sonnet'),
})