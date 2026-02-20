import * as z from "zod"
import { detectAgentType } from "./agentType"
import { AssistantChatMessageWithToolUses } from "./assistantChatMessageWithToolUses"
import { ChatMessage } from "./chatMessage"
import { LLM } from "./LLM"
import { MultiPartChatMessage } from "./multiPartChatMessage"
import { Tools } from "./tools"
import {
  MessagePart, ToolResult,
  ToolResultPart,
  UserChatMessage,
  UserChatMessageWithToolResults,
} from "./userChatMessageWithToolResults"

export const AssistantSimpleMessage = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantSimpleMessage'),
  content: z.string(),
})
export type AssistantSimpleMessage = z.infer<typeof AssistantSimpleMessage>

export const MatterhornMessage = z.discriminatedUnion('type', [
  ChatMessage,
  MultiPartChatMessage,
  AssistantChatMessageWithToolUses,
  UserChatMessageWithToolResults,
  UserChatMessage,
  AssistantSimpleMessage,
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
    const agentType = detectAgentType(chat.system)
    return {
      ...chat,
      agentType,
      messages: chat.messages.map(message => {
        if (message.type === ChatMessage.shape.type.value) {
          switch (message.kind) {
            case 'Assistant':
              return {
                type: AssistantSimpleMessage.shape.type.value,
                content: message.content,
              } satisfies AssistantSimpleMessage
            case 'User':
              return {
                type: UserChatMessage.shape.type.value,
                parts: [{
                  type: 'text',
                  text: message.content,
                }],
              } satisfies UserChatMessage
          }
        }
        if (message.type === MultiPartChatMessage.shape.type.value) {
          switch (message.kind) {
            case 'Assistant':
              return message
            case 'User':
              return {
                type: UserChatMessage.shape.type.value,
                parts: message.parts.filter(part => part.type === 'text'),
              } satisfies UserChatMessage
          }
        }
        if (message.type === AssistantChatMessageWithToolUses.shape.type.value) {
          return message
        }
        if (message.type === UserChatMessageWithToolResults.shape.type.value) {
          return {
            type: UserChatMessage.shape.type.value,
            parts: message.toolResults.map(result => ({
              type: 'toolResult',
              toolResult: {
                toolCallId: {
                  id: 'unknown',
                  callId: 'unknown',
                  name: 'unknown',
                  provider: 'unknown',
                },
                content: result.content,
                isError: result.isError,
                images: [],
              } satisfies ToolResult,
            } satisfies ToolResultPart)),
          } satisfies UserChatMessage
        }
        if (message.type === UserChatMessage.shape.type.value || message.type === AssistantSimpleMessage.shape.type.value) {
          return message
        }
        throw new Error(`Unexpected message type: ${message.type}, ${message.kind}`)
      }),
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

