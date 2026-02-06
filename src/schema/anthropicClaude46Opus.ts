import * as z from "zod"
import { AnthropicClaude45Opus } from "./anthropicClaude45Opus"

export const AnthropicClaude46Opus = AnthropicClaude45Opus.extend({
  jbai: z.literal('anthropic-claude-4-6-opus'),
})