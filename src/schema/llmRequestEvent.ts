import * as z from "zod"
import { AssistantChatMessageWithToolUses } from "./assistantChatMessageWithToolUses"
import { ChatMessage } from "./chatMessage"
import { LLM } from "./LLM"
import { MultiPartChatMessage } from "./multiPartChatMessage"
import { Tools } from "./tools"
import { UserChatMessageWithToolResults } from "./userChatMessageWithToolResults"

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
    cacheUserGroupID: z.string().optional(),
  }),
  modelParameters: z.looseObject({
    model: LLM,
    prompt_cache_enabled: z.boolean().default(() => false),
    temperature: z.number().optional(),
    n: z.number().optional(),
    stop: z.record(z.string(), z.string()).optional(),
    max_tokens: z.number().optional(),
    user: z.string().optional(),
    reasoning_effort: z.string().default(() => 'reasoning unknown'),
    text_verbosity: z.string().optional(),
    model_api_version: z.string().optional(),
    include_encrypted_content: z.boolean().optional(),
  }),
  attemptNumber: z.number(),
  id: z.string(),
})
export type LlmRequestEvent = z.infer<typeof LlmRequestEvent>