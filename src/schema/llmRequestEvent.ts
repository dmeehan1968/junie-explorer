import * as z from "zod"
import { detectAgentType } from "./agentType"
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
  }).transform(chat => {
    return {
      ...chat,
      agentType: detectAgentType(chat.system),
    }
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
    effort: z.string().optional(),
    text_verbosity: z.string().optional(),
    model_api_version: z.string().optional(),
    include_encrypted_content: z.boolean().optional(),
  }).transform(params => ({
    ...params,
    reasoning_effort: params.reasoning_effort ?? params.effort ?? 'default',
  })),
  attemptNumber: z.number(),
  id: z.string(),
  previousRequest: z.looseObject({ type: z.literal('LlmRequestEvent') }).optional(),
})
export type LlmRequestEvent = z.infer<typeof LlmRequestEvent>

export const isRequestEvent = (event: any): event is LlmRequestEvent => {
  if (event === null || typeof event !== 'object') return false
  if (!('type' in event)) return false
  return event.type === 'LlmRequestEvent'
}

