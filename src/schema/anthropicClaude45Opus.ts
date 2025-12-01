import * as z from "zod"
import { AnthropicSonnet45 } from "./anthropicSonnet45"

export const AnthropicClaude45Opus = AnthropicSonnet45.extend({
  jbai: z.literal('anthropic-claude-4-5-opus'),
})