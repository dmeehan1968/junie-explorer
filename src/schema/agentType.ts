import * as z from "zod"

export const AgentType = z.enum(['Assistant', 'TaskSummarizer', 'Memorizer', 'ErrorAnalyzer', 'LanguageIdentifier', 'MemoryCompactor'])
export type AgentType = z.infer<typeof AgentType>

const AGENT_TYPE_PATTERNS: Record<AgentType, RegExp[]> = {
  [AgentType.enum.Assistant]: [
    /^## ENVIRONMENT/,
    /^You are a programming expert/,
    /^SETTING: Your role is a coding assistant/,
    /^$/,
  ],
  [AgentType.enum.TaskSummarizer]: [
    /^You are a programming task description summarizer/,
    /^You are a task step summarizer/,
    /^You are a task trace summarizer/,
    /^You are a task summarizer/,
    /^You are a chat response title creator/,
    /^Your task is to summarize/,
  ],
  [AgentType.enum.Memorizer]: [
    /^You are Memory Extractor/,
    /^You are an \*\*Execution trajectory reflection utility\*\*/,
    /^You are a \*\*User-reflection utility\*\*/,
  ],
  [AgentType.enum.ErrorAnalyzer]: [
    /^You are an \*\*Error-analysis utility\*\*/,
  ],
  [AgentType.enum.LanguageIdentifier]: [
    /^You are a language identifier utility/,
    /^You are a language identification utility/,
  ],
  [AgentType.enum.MemoryCompactor]: [
    /^You are a memory compaction utility/,
  ],
} as const

export function detectAgentType(systemPrompt: string): AgentType {

  for (const [agentType, patterns] of Object.entries(AGENT_TYPE_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(systemPrompt))) {
      return AgentType.parse(agentType)
    }
  }

  console.error(`Unknown agent type for system prompt: "${systemPrompt.substring(0, 100)}"..., Defaulting to Assistant.`)
  return AgentType.enum.Assistant
}