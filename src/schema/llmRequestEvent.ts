import * as z from "zod"
import { AgentType } from "./agentType"
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
    let agentType: AgentType

    if (/^(## ENVIRONMENT|You are a programming expert|$)/.test(chat.system)) {
      agentType = AgentType.enum.Agent
    } else if (/^(You are a programming task description summarizer|You are a task ((step|trace) )?summarizer|You are a chat response title creator|^Your task is to summarize)/.test(chat.system)) {
      agentType = AgentType.enum.TaskSummarizer
    } else if (/^(You are Memory Extractor|You are an \*\*Execution trajectory reflection utility\*\*|You are a \*\*User-reflection utility\*\*)/.test(chat.system)) {
      agentType = AgentType.enum.Memorizer
    } else if (/^You are an \*\*Error-analysis utility\*\*/.test(chat.system)) {
      agentType = AgentType.enum.ErrorAnalyzer
    } else if (/^You are a language (identifier|identification) utility/.test(chat.system)) {
      agentType = AgentType.enum.LanguageIdentifier
    } else {
      throw new Error(`Unknown agent type for system prompt: ${chat.system.substring(0, 50)}...`)
    }

    return {
      ...chat,
      agentType,
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
    reasoning_effort: z.string().default(() => 'reasoning unknown'),
    text_verbosity: z.string().optional(),
    model_api_version: z.string().optional(),
    include_encrypted_content: z.boolean().optional(),
  }),
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
