import { literal, z } from "zod"

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
      jbai: z.string().optional(),
      capabilities: z.object({
        inputPrice: z.number(),
        outputPrice: z.number(),
        cacheInputPrice: z.number(),
      }).passthrough().default(() => ({ inputPrice: 0, outputPrice: 0, cacheInputPrice: 0 })),
    }).passthrough(),
  }).passthrough(),
  attemptNumber: z.number(),
  id: z.string(),
}).passthrough()

export const ContentChoice = z.object({
  content: z.string(),
})
export const AIToolUseAnswerChoice = ContentChoice.extend({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice'),
  usages: z.object({
    toolId: z.string(),
    toolName: z.string(),
    toolParams: z.object({
      ParameterValue: z.string(),
      name: z.string(),
      value: z.any(),
    }).array().default(() => ([])),
  }).array().default(() => ([])),
}).passthrough()

export const AIContentAnswerChoice = ContentChoice.extend({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.AIContentAnswerChoice'),
}).passthrough()

export const BaseCapabilities = z.object({
  inputPrice: z.number(),
  outputPrice: z.number(),
  cacheInputPrice: z.number().default(() => 0),
  cacheCreateInputPrice: z.number().default(() => 0),
}).passthrough()

export const LLMBase = z.object({
  provider: z.string(),
  name: z.string(),
  inputPrice: z.number().optional(),              // deprecated
  outputPrice: z.number().optional(),             // deprecated
  cacheInputPrice: z.number().optional(),         // deprecated
  cacheCreateInputPrice: z.number().optional(),   // deprecated
}).passthrough()

export const OpenAIo3 = LLMBase.extend({
  jbai: z.literal('openai-o3'),
  capabilities: BaseCapabilities.optional()
}).passthrough()

export const OpenAI4oMini = LLMBase.extend({
  jbai: z.literal('openai-gpt-4o-mini'),
  capabilities: BaseCapabilities.optional()
}).passthrough()

export const AnthropicSonnet37 = LLMBase.extend({
  jbai: z.literal('anthropic-claude-3.7-sonnet'),
  capabilities: BaseCapabilities.extend({
    maxOutputTokens: z.number(),
    vision: z.object({
      maxDimension: z.number(),
      maxPixels: z.number(),
      maxDimensionDivider: z.number(),
    }).passthrough().optional(),
    supportsAssistantMessageResuming: z.boolean().default(() => false),
  }).optional(),
}).passthrough()

export const AnthropicSonnet4 = AnthropicSonnet37.extend({
  jbai: z.literal('anthropic-claude-4-sonnet'),
}).passthrough()

// Need to do manual discrimination because there are multiple data formats and models and not a singular way to
// discriminate and then transform them.  So this is a two part process, transform them into common formats
// and then use a discriminated union to parse them so that the output type narrows correctly.
export const LLMTransformer = z.any().transform(data => {
  if (!('jbai' in data) && !('capabilities' in data)) {
    if (/4o-mini/i.test(data.name)) {
      return OpenAI4oMini.parse({
        jbai: 'openai-gpt-4o-mini',
        name: data.name,
        provider: data.provider,
        capabilities: {
          inputPrice: data.inputPrice ?? 0,
          outputPrice: data.outputPrice ?? 0,
          cacheInputPrice: data.cacheInputPrice ?? 0,
        }
      })
    }
    return AnthropicSonnet37.parse({
      jbai: 'anthropic-claude-3.7-sonnet',
      name: data.name,
      provider: data.provider,
      capabilities: {
        inputPrice: data.inputPrice ?? 0,
        outputPrice: data.outputPrice ?? 0,
        cacheInputPrice: data.cacheInputPrice ?? 0,
        maxOutputTokens: data.maxOutputTokens ?? 0,
        vision: data.vision,
        supportsAssistantMessageResuming: data.supportsAssistantMessageResuming ?? false,
      }
    })
  }
  if (data.jbai === 'openai-gpt-4o-mini' && !('capabilities' in data)) {
    return OpenAI4oMini.parse({
      name: data.name,
      provider: data.provider,
      jbai: 'openai-gpt-4o-mini',
      capabilities: {
        inputPrice: data.inputPrice ?? 0,
        outputPrice: data.outputPrice ?? 0,
        cacheInputPrice: data.cacheInputPrice ?? 0,
      }
    })
  }
  if (data.jbai === 'openai-o3' && 'capabilities' in data) {
    return OpenAIo3.parse(data)
  }
  if (data.jbai === 'openai-gpt-4o-mini' && 'capabilities' in data) {
    return OpenAI4oMini.parse(data)
  }
  if (data.jbai === 'anthropic-claude-3.7-sonnet' && 'capabilities' in data) {
    return AnthropicSonnet37.parse(data)
  }
  if (data.jbai === 'anthropic-claude-3.7-sonnet' && !('capabilities' in data)) {
    return AnthropicSonnet37.parse({
      name: data.name,
      provider: data.provider,
      jbai: 'anthropic-claude-3.7-sonnet',
      capabilities: {
        inputPrice: data.inputPrice ?? 0,
        outputPrice: data.outputPrice ?? 0,
        cacheInputPrice: data.cacheInputPrice ?? 0,
        maxOutputTokens: data.maxOutputTokens ?? 0,
        vision: data.vision,
        supportsAssistantMessageResuming: data.supportsAssistantMessageResuming ?? false,
      }
    })
  }
  if (data.jbai === 'anthropic-claude-4-sonnet' && 'capabilities' in data) {
    return AnthropicSonnet4.parse(data)
  }
})

export const LLM = LLMTransformer.transform(data => z.discriminatedUnion('jbai', [
  OpenAIo3,
  OpenAI4oMini,
  AnthropicSonnet37,
  AnthropicSonnet4,
]).parse(data))

export const LlmResponseEvent = z.object({
  type: z.literal('LlmResponseEvent'),
  id: z.string(),
  answer: z.object({
    llm: LLM,
    contentChoices: z.discriminatedUnion('type', [AIContentAnswerChoice, AIToolUseAnswerChoice]).array(),
    inputTokens: z.number().int().default(() => 0),
    outputTokens: z.number().int().default(() => 0),
    cacheInputTokens: z.number().int().default(() => 0),
    cacheCreateInputTokens: z.number().int().default(() => 0),
    time: z.number().optional(),
  }).passthrough().transform(answer => {
    const million = 1_000_000
    return {
      ...answer,
      cost: (answer.inputTokens / million) * (answer.llm?.capabilities?.inputPrice ?? answer.llm?.inputPrice ?? 0)
        + (answer.outputTokens / million) * (answer.llm?.capabilities?.outputPrice ?? answer.llm?.outputPrice ?? 0)
        + (answer.cacheInputTokens / million) * (answer.llm?.capabilities?.cacheInputPrice ?? answer.llm?.cacheInputPrice ?? 0)
        + (answer.cacheCreateInputTokens / million) * (answer.llm?.capabilities?.cacheCreateInputPrice ?? answer.llm?.cacheCreateInputPrice ?? 0),
    }
  }),
}).passthrough()
export const TaskSummaryCreatedEvent = z.object({
  type: z.literal('TaskSummaryCreatedEvent'),
  taskSummary: z.string(),
}).passthrough()
export const AgentStateUpdatedEvent = z.object({
  type: z.literal('AgentStateUpdatedEvent'),
  state: z.object({
    issue: z.object({
      description: z.string().optional(),
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
    }).passthrough().optional(),
  }).passthrough(),
}).passthrough()
export const PlanUpdatedEvent = z.object({
  type: z.literal('PlanUpdatedEvent'),
  plan: z.object({
    description: z.string(),
    status: z.string(),
  }).passthrough().array(),
}).passthrough()

const ParamsObject = z.record(z.any())
type ParamsObject = z.infer<typeof ParamsObject>
const ParamsArray = z.object({
  ParameterValue: z.string(),
  name: z.string(),
  value: z.any(),
}).passthrough().array().transform(params => {
  return ParamsObject.parse(params.reduce((acc, { name, value }) => {
    acc[name] = value
    return acc
  }, {} as ParamsObject))
})

export const AgentActionExecutionStarted = z.object({
  type: z.literal('AgentActionExecutionStarted'),
  actionToExecute: z.object({
    type: z.string(),
    name: z.string(),
    id: z.string().optional(),
    inputParams: z.union([ParamsObject, ParamsArray]).optional(),
    description: z.string().optional(),
  }).passthrough(),
}).passthrough()
export const AgentActionExecutionFailed = AgentActionExecutionStarted.extend({
  type: z.literal('AgentActionExecutionFailed'),
  result: z.object({
    text: z.string(),
    images: z.any().array(),
  }).passthrough().optional(),
}).passthrough()

export const AgentInteractionStarted = z.object({
  type: z.literal('AgentInteractionStarted'),
  interaction: z.object({
    interactionId: z.object({
      id: z.string(),
    }),
    runCancelableInteraction: z.object({
      name: z.string(),
    }).passthrough().optional(),
    askInteraction: z.object({
      question: z.string(),
    }).passthrough().optional(),
  }).passthrough(),
}).passthrough()
export type AgentInteractionStarted = z.infer<typeof AgentInteractionStarted>

export const AgentInteractionFinished = z.object({
  type: z.literal('AgentInteractionFinished'),
  interactionId: z.object({
    id: z.string(),
  }).passthrough(),
}).passthrough()
export type AgentInteractionFinished = z.infer<typeof AgentInteractionFinished>

export const ResponseTextAppeared = z.object({
  type: z.literal('com.intellij.ml.llm.matterhorn.agent.ResponseTextAppeared'),
  text: z.string(),
}).passthrough()
export type ResponseTextAppeared = z.infer<typeof ResponseTextAppeared>

export const BeforeStepStartedEvent = z.object({
  type: z.literal('BeforeStepStartedEvent'),
  // TODO
}).passthrough()
export const StepMetaInfoAppearedEvent = z.object({
  type: z.literal('StepMetaInfoAppearedEvent'),
  stepName: z.string(),
  stepType: z.string(),
}).passthrough()
export const StepSummaryCreatedEvent = z.object({
  type: z.literal('StepSummaryCreatedEvent'),
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
export const TaskReportCreatedEvent = z.object({
  type: z.literal('TaskReportCreatedEvent'),
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
  TaskReportCreatedEvent,
  AgentStateUpdatedEvent,
  PlanUpdatedEvent,
  AgentActionExecutionStarted,
  AgentActionExecutionFinished,
  AgentActionExecutionFailed,
  AgentInteractionStarted,
  AgentInteractionFinished,
  ResponseTextAppeared,
  BeforeStepStartedEvent,
  StepMetaInfoAppearedEvent,
  AfterStepFinishedEvent,
  StepSummaryCreatedEvent,
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