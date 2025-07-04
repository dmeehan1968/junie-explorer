import { z } from "zod"

export const BeforeArtifactBuildingStarted = z.object({
  type: z.literal('BeforeArtifactBuildingStarted'),
  requestId: z.object({
    data: z.string(),
  }).passthrough(),
}).passthrough()
export const AfterArtifactBuildingFinished = z.object({
  type: z.literal('AfterArtifactBuildingFinished'),
  requestId: z.object({
    data: z.string(),
  }).passthrough(),
}).passthrough()
export const LlmRequestEvent = z.object({
  type: z.literal('LlmRequestEvent'),
  chat: z.object({
    system: z.string(),
    messages: z.object({
      type: z.string(),
      content: z.string().optional(),
      kind: z.enum(['User', 'Assistant']).optional(),
      // TODO: toolUses, toolResults
    }).passthrough().array(),
    // TODO: tools
  }).passthrough(),
  modelParameters: z.object({
    model: z.object({
      name: z.string(),
      provider: z.string(),
      jbai: z.string(),
      capabilities: z.object({
        inputPrice: z.number(),
        outputPrice: z.number(),
        cacheInputPrice: z.number(),
      }).passthrough(),
    }).passthrough(),
  }).passthrough(),
  attemptNumber: z.number(),
  id: z.string(),
}).passthrough()
export const LlmResponseEvent = z.object({
  type: z.literal('LlmResponseEvent'),
  answer: z.object({
    llm: z.object({
      name: z.string(),
      provider: z.string(),
      jbai: z.string(),
      capabilities: z.object({
        inputPrice: z.number(),
        outputPrice: z.number(),
        cacheInputPrice: z.number().default(() => 0),
        cacheCreateInputPrice: z.number().default(() => 0),
      }).passthrough(),
    }).passthrough(),
    contentChoices: z.object({
      type: z.string(),
      content: z.string(),
    }).passthrough().array(),
    inputTokens: z.number().int().default(() => 0),
    outputTokens: z.number().int().default(() => 0),
    cacheInputTokens: z.number().int().default(() => 0),
    cacheCreateInputTokens: z.number().int().default(() => 0),
    time: z.number().optional(),
  }).passthrough().transform(answer => {
    const million = 1_000_000
    return {
      ...answer,
      cost: (answer.inputTokens / million) * answer.llm.capabilities.inputPrice
        + (answer.outputTokens / million) * answer.llm.capabilities.outputPrice
        + (answer.cacheInputTokens / million) * answer.llm.capabilities.cacheInputPrice
        + (answer.cacheCreateInputTokens / million) * answer.llm.capabilities.cacheCreateInputPrice,
    }
  }),
  id: z.string(),
}).passthrough()
export const TaskSummaryCreatedEvent = z.object({
  type: z.literal('TaskSummaryCreatedEvent'),
  taskSummary: z.string(),
}).passthrough()
export const AgentStateUpdatedEvent = z.object({
  type: z.literal('AgentStateUpdatedEvent'),
  state: z.object({
    issue: z.object({
      description: z.string(),
      editorContext: z.object({
        recentFiles: z.string().array(),
        openFiles: z.string().array(),
      }),
    }).passthrough(),
    observations: z.object({
      // TODO
    }).passthrough().array(),
    ideInitialState: z.object({
      content: z.string(),
      kind: z.enum(['User', 'Assistant']),
    }).passthrough(),
  }).passthrough(),
}).passthrough()
export const PlanUpdatedEvent = z.object({
  type: z.literal('PlanUpdatedEvent'),
  plan: z.object({
    description: z.string(),
    status: z.string(),
  }).passthrough().array(),
}).passthrough()
export const AgentActionExecutionStarted = z.object({
  type: z.literal('AgentActionExecutionStarted'),
  // TODO
}).passthrough()
export const BeforeStepStartedEvent = z.object({
  type: z.literal('BeforeStepStartedEvent'),
  // TODO
}).passthrough()
export const StepMetaInfoAppearedEvent = z.object({
  type: z.literal('StepMetaInfoAppearedEvent'),
  stepName: z.string(),
  stepType: z.string(),
}).passthrough()
export const AfterStepFinishedEvent = z.object({
  type: z.literal('AfterStepFinishedEvent'),
  // TODO
}).passthrough()
export const AgentActionExecutionFinished = z.object({
  type: z.literal('AgentActionExecutionFinished'),
  // TODO
}).passthrough()
export const AgentSessionUpdatedEvent = z.object({
  type: z.literal('AgentSessionUpdatedEvent'),
  // TODO
}).passthrough()
export const ActionRequestBuildingStarted = z.object({
  type: z.literal('ActionRequestBuildingStarted'),
  attemptNumber: z.number(),
}).passthrough()
export const ActionRequestBuildingFailed = z.object({
  type: z.literal('ActionRequestBuildingFailed'),
  attemptNumber: z.number(),
}).passthrough()
export const ActionRequestBuildingFinished = z.object({
  type: z.literal('ActionRequestBuildingFinished'),
  attemptNumber: z.number(),
  actionRequest: z.object({
    // TODO
  }).passthrough(),
}).passthrough()
export const TaskResultCreatedEvent = z.object({
  type: z.literal('TaskResultCreatedEvent'),
  // TODO
}).passthrough()
export const SemanticCheckStarted = z.object({
  type: z.literal('SemanticCheckStarted'),
  // TODO
}).passthrough()
export const SemanticCheckFinished = z.object({
  type: z.literal('SemanticCheckFinished'),
  // TODO
}).passthrough()
export const ErrorCheckerStarted = z.object({
  type: z.literal('ErrorCheckerStarted'),
  // TODO
}).passthrough()
export const ErrorCheckerFinished = z.object({
  type: z.literal('ErrorCheckerFinished'),
  // TODO
}).passthrough()
export const EditEvent = z.object({
  type: z.literal('EditEvent'),
  // TODO
}).passthrough()
export const LongDelayDetected = z.object({
  type: z.literal('LongDelayDetected'),
}).passthrough()
export const LlmRequestFailed = z.object({
  type: z.literal('LlmRequestFailed'),
  // TODO
})
export const McpInitStarted = z.object({
  type: z.literal('McpInitStarted'),
  // TODO
})
export const McpInitFinished = z.object({
  type: z.literal('McpInitFinished'),
  // TODO
})
export const UnknownEvent = z.object({
  type: z.string(),
}).passthrough()
export const Event = z.discriminatedUnion('type', [
  BeforeArtifactBuildingStarted,
  AfterArtifactBuildingFinished,
  LlmRequestEvent,
  LlmResponseEvent,
  TaskSummaryCreatedEvent,
  AgentStateUpdatedEvent,
  PlanUpdatedEvent,
  AgentActionExecutionStarted,
  BeforeStepStartedEvent,
  StepMetaInfoAppearedEvent,
  AfterStepFinishedEvent,
  AgentActionExecutionFinished,
  AgentSessionUpdatedEvent,
  ActionRequestBuildingStarted,
  ActionRequestBuildingFailed,
  ActionRequestBuildingFinished,
  TaskResultCreatedEvent,
  SemanticCheckStarted,
  SemanticCheckFinished,
  ErrorCheckerStarted,
  ErrorCheckerFinished,
  LongDelayDetected,
  LlmRequestFailed,
  EditEvent,
  McpInitStarted,
  McpInitFinished,
])
export type Event = z.infer<typeof Event>

export const EventRecord = z.object({
  event: Event,
  timestampMs: z.coerce.date(),
  parseError: z.any().optional(),
}).passthrough().transform(({ timestampMs, ...rest }) => ({ timestamp: timestampMs, ...rest }))
export type EventRecord = z.infer<typeof EventRecord>

export const UnknownEventRecord = z.object({
  event: UnknownEvent,
  timestampMs: z.coerce.date(),
  parseError: z.any().optional(),
}).passthrough().transform(({ timestampMs, ...rest }) => ({ timestamp: timestampMs, ...rest }))
export type UnknownEventRecord = z.infer<typeof UnknownEventRecord>