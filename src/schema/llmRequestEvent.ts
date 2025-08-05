import * as z from "zod"
import { AssistantChatMessageWithToolUses } from "./assistantChatMessageWithToolUses.js"
import { ChatMessage } from "./chatMessage.js"
import { LLM } from "./LLM.js"
import { MultiPartChatMessage } from "./multiPartChatMessage.js"
import { Tools } from "./tools.js"
import { UserChatMessageWithToolResults } from "./userChatMessageWithToolResults.js"

export const MatterhornMessage = z.discriminatedUnion('type', [
  ChatMessage,
  MultiPartChatMessage,
  AssistantChatMessageWithToolUses,
  UserChatMessageWithToolResults,
])
export type MatterhornMessage = z.infer<typeof MatterhornMessage>

export const LlmRequestEvent = z.looseObject({
  type: z.literal('LlmRequestEvent'),
  chat: z.looseObject({
    system: z.string(),
    messages: MatterhornMessage.array(),
    tools: Tools,
  }),
  modelParameters: z.looseObject({
    model: LLM,
    prompt_cache_enabled: z.boolean().default(() => false),
    temperature: z.number().optional(),
    n: z.number().optional(),
    stop: z.record(z.string(), z.string()).optional(),
    max_tokens: z.number().optional(),
    user: z.string().optional(),
    reasoning_effort: z.string().optional(),
    text_verbosity: z.string().optional(),
    model_api_version: z.string().optional(),
    include_encrypted_content: z.boolean().optional(),
  }),
  attemptNumber: z.number(),
  id: z.string(),
})
export type LlmRequestEvent = z.infer<typeof LlmRequestEvent>