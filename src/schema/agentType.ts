import * as z from "zod"

export const AgentType = z.enum(['Agent', 'TaskSummarizer', 'Memorizer', 'ErrorAnalyzer', 'LanguageIdentifier'])
export type AgentType = z.infer<typeof AgentType>