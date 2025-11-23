import { z } from "zod"

export const JunieChainSchema = z.looseObject({
  id: z.looseObject({
    id: z.uuid(),
  }),
  name: z.string().or(z.null()),
  created: z.coerce.date(),
  state: z.enum(['Done', 'Stopped', 'Finished', 'Running', 'Declined', 'Failed', 'WaitingUserInput']),
  error: z.any().optional(),
})
export type JunieChain = z.infer<typeof JunieChainSchema>

export const JuniePlanSchema = z.looseObject({
  description: z.string(),
  status: z.enum(['DONE', 'IN_PROGRESS', 'PENDING', 'ERROR', 'CANCELLED', 'CANCELED'])
    .transform((status => status === 'CANCELED' ? 'CANCELLED' : status)),
})
export type JuniePlan = z.infer<typeof JuniePlanSchema>

export const SessionHistory = z.looseObject({
  viewedFiles: z.string().array(),
  viewedImports: z.string().array(),
  createdFiles: z.string().array(),
  shownCode: z.record(z.string(), z.looseObject({
    first: z.number(),
    second: z.number(),
  }).array()),
})
export type SessionHistory = z.infer<typeof SessionHistory>

export const TasksInfo = z.looseObject({
  agentState: z.any().nullish(),  // this should be AgentState but I can't figure out how to create the recursive schema
  patch: z.string().nullish(),
  sessionHistory: SessionHistory.nullish(),
})
export type TasksInfo = z.infer<typeof TasksInfo>

export const AgentIssue = z.looseObject({
  description: z.string().nullish(),
  editorContext: z.looseObject({
    recentFiles: z.string().array(),
    openFiles: z.string().array(),
  }),
  previousTasksInfo: TasksInfo.nullish(),
})
export type AgentIssue = z.infer<typeof AgentIssue>

export const AgentObservation = z.looseObject({
  element: z.looseObject({
    type: z.string(),
    content: z.string().optional(),
    kind: z.enum(['Assistant', 'User']).optional(),
  }).nullish(),
  action: z.string().nullish(), // as well as the 'special commands', this can include any CLI command
})
export type AgentObservation = z.infer<typeof AgentObservation>

export const AgentState = z.looseObject({
  issue: AgentIssue,
  observations: AgentObservation.nullish().array(),
  ideInitialState: z.looseObject({
    content: z.string(),
    kind: z.enum(['User']),
  }).nullish(),
})
export type AgentState = z.infer<typeof AgentState>

export const JunieTaskContext = z.looseObject({
  type: z.enum(['CHAT', 'CODE']).nullish(),
  description: z.string(),
})
export type JunieTaskContext = z.infer<typeof JunieTaskContext>

export const PreviousTasksInfo = z.looseObject({
  agentState: AgentState.nullish(),
  patch: z.string().nullish(),
  sessionHistory: SessionHistory.nullish(),
  steps: z.string().array().nullish(),
  filesEdited: z.string().array().nullish(),
  filesRemoved: z.string().array().nullish(),
})
export type PreviousTasksInfo = z.infer<typeof PreviousTasksInfo>

export const JunieTaskSchema = z.looseObject({
  id: z.looseObject({
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
}).transform(({ id, artifactPath, ...task }) => ({
  id: artifactPath,
  index: id.index,
  ...task,
}))
export type JunieTask = z.infer<typeof JunieTaskSchema>

const StepContent = z.looseObject({
  llmResponse: z.looseObject({
    type: z.string(),
    content: z.string(),
    kind: z.enum(['Assistant', 'User']).optional(),
  }).optional(),
  actionRequest: z.looseObject({
    type: z.string(),
    name: z.string(),
    arguments: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  actionResult: z.looseObject({
    type: z.string(),
    content: z.string().optional(),
    kind: z.enum(['Assistant', 'User']).optional(),
  }).optional(),
})
export type StepContent = z.infer<typeof StepContent>

const Dependencies = z.looseObject({
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

export const JunieStatistics = z.looseObject({
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

export const JunieException = z.looseObject({
  type: z.string(),
  message: z.string().nullish()
})
export type JunieException = z.infer<typeof JunieException>

export const JunieStepSchema = z.looseObject({
  id: z.string(),
  title: z.string(),
  reasoning: z.looseObject({
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
  webSearchCount: number;
  cost: number;
  time: number;
  metricCount: number;
}