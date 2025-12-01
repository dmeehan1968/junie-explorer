import * as z from "zod"

export enum AgentType {
  Assistant = 'Assistant',
  TaskSummarizer = 'TaskSummarizer',
  Memorizer = 'Memorizer',
  ErrorAnalyzer = 'ErrorAnalyzer',
  LanguageIdentifier = 'LanguageIdentifier',
}

export const AgentTypeSchema = z.nativeEnum(AgentType)
