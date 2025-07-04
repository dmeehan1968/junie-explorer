import { z } from "zod"

export const JunieChainSchema = z.object({
  id: z.object({
    id: z.string().uuid(),
  }),
  name: z.string().or(z.null()),
  created: z.coerce.date(),
  state: z.enum(['Done', 'Stopped', 'Finished', 'Running', 'Declined', 'Failed']),
  error: z.any().optional(),
})
export type JunieChain = z.infer<typeof JunieChainSchema>

export const JuniePlanSchema = z.object({
  description: z.string(),
  status: z.enum(['DONE', 'IN_PROGRESS', 'PENDING', 'ERROR']),
})
export type JuniePlan = z.infer<typeof JuniePlanSchema>

export const SessionHistory = z.object({
  viewedFiles: z.string().array(),
  viewedImports: z.string().array(),
  createdFiles: z.string().array(),
  shownCode: z.record(z.object({
    first: z.number(),
    second: z.number(),
  }).array()),
})
export type SessionHistory = z.infer<typeof SessionHistory>

export const TasksInfo = z.object({
  agentState: z.any().nullish(),  // this should be AgentState but I can't figure out how to create the recursive schema
  patch: z.string().nullish(),
  sessionHistory: SessionHistory.nullish(),
})
export type TasksInfo = z.infer<typeof TasksInfo>

export const AgentIssue = z.object({
  description: z.string().nullish(),
  editorContext: z.object({
    recentFiles: z.string().array(),
    openFiles: z.string().array(),
  }),
  previousTasksInfo: TasksInfo.nullish(),
})
export type AgentIssue = z.infer<typeof AgentIssue>

export const AgentObservation = z.object({
  element: z.object({
    type: z.string(),
    content: z.string().optional(),
    kind: z.enum(['Assistant', 'User']).optional(),
  }).nullish(),
  action: z.string().nullish(), // as well as the 'special commands', this can include any CLI command
})
export type AgentObservation = z.infer<typeof AgentObservation>

export const AgentState = z.object({
  issue: AgentIssue,
  observations: AgentObservation.nullish().array(),
  ideInitialState: z.object({
    content: z.string(),
    kind: z.enum(['User']),
  }).nullish(),
})
export type AgentState = z.infer<typeof AgentState>

export const JunieTaskContext = z.object({
  type: z.enum(['CHAT']).nullish(),
  description: z.string(),
})
export type JunieTaskContext = z.infer<typeof JunieTaskContext>

export const PreviousTasksInfo = z.object({
  agentState: AgentState,
  patch: z.string().nullish(),
  sessionHistory: SessionHistory.nullish(),
})
export type PreviousTasksInfo = z.infer<typeof PreviousTasksInfo>

export const JunieTaskSchema = z.object({
  id: z.object({
    index: z.number(),
  }),
  created: z.coerce.date(),
  artifactPath: z.string(),
  context: JunieTaskContext,
  isDeclined: z.boolean(),
  plan: JuniePlanSchema.array().default(() => ([])),
  previousTasksInfo: PreviousTasksInfo.nullish(),
  finalAgentState: AgentState.nullish(),
  sessionHistory: SessionHistory.nullish(),
  patch: z.string().nullish(),

}).transform(({ id: _, artifactPath, ...task }) => ({
  id: artifactPath,
  ...task,
}))
export type JunieTask = z.infer<typeof JunieTaskSchema>

const StepContent = z.object({
  llmResponse: z.object({
    type: z.enum(['com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage']),
    content: z.string(),
    kind: z.enum(['Assistant', 'User']),
  }).optional(),
  actionRequest: z.object({
    type: z.enum(['com.intellij.ml.llm.matterhorn.ej.core.actions.SimpleActionRequest']),
    name: z.string(),
    arguments: z.string(),
    description: z.string(),
  }).optional(),
  actionResult: z.object({
    type: z.enum(['com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage']),
    content: z.string(),
    kind: z.enum(['Assistant', 'User']),
  }).optional(),
})
export type StepContent = z.infer<typeof StepContent>

const Dependencies = z.object({
  id: z.string(),
  cached: z.boolean(),
})
export type Dependencies = z.infer<typeof Dependencies>

const Description = z.string().transform(v => {
  try {
    return JSON.parse(v)
  } catch (e) {
    console.log(e)
  }
  return v
})
export type Description = z.infer<typeof Description>

export const JunieStatistics = z.object({
  totalArtifactBuildTimeSeconds: z.number().default(() => 0),
  artifactTime: z.number(),
  modelTime: z.number(),
  modelCachedTime: z.number(),
  requests: z.number(),
  cachedRequests: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheInputTokens: z.number(),
  cacheCreateInputTokens: z.number(),
  cost: z.number(),
  cachedCost: z.number(),
})
export type JunieStatistics = z.infer<typeof JunieStatistics>

export const JunieException = z.object({
  type: z.string(),
  message: z.string().nullish()
}).passthrough()
export type JunieException = z.infer<typeof JunieException>

export const JunieStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  reasoning: z.object({
    type: z.enum([
      'com.intellij.ml.llm.matterhorn.ArtifactReasoning.Success',
      'com.intellij.ml.llm.matterhorn.ArtifactReasoning.Failure',
    ]),
    reason: z.string().or(JunieException),
  }),
  statistics: JunieStatistics,
  content: StepContent.nullish(),
  dependencies: Dependencies.array().default(() => ([])),
  description: Description.nullish(),
})
export type JunieStep = z.infer<typeof JunieStepSchema>

export interface SummaryMetrics {
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  cost: number;
  time: number;
}