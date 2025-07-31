import { z } from "zod"

export const BeforeArtifactBuildingStarted = z.looseObject({
  type: z.literal('BeforeArtifactBuildingStarted'),
  requestId: z.looseObject({
    data: z.string(),
  }),
})
export const AfterArtifactBuildingFinished = z.looseObject({
  type: z.literal('AfterArtifactBuildingFinished'),
  requestId: z.looseObject({
    data: z.string(),
  }),
})
export const ContentChoice = z.looseObject({
  content: z.string(),
})
export const AIToolUseAnswerChoice = ContentChoice.extend({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice'),
  usages: z.looseObject({
    toolId: z.string(),
    toolName: z.string(),
    toolParams: z.object({
      ParameterValue: z.string(),
      name: z.string(),
      value: z.any(),
    }).array().default(() => ([])),
  }).array().default(() => ([])),
})

export const AIContentAnswerChoice = ContentChoice.extend({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.AIContentAnswerChoice'),
})

export const BaseCapabilities = z.looseObject({
  inputPrice: z.number(),
  outputPrice: z.number(),
  cacheInputPrice: z.number().default(() => 0),
  cacheCreateInputPrice: z.number().default(() => 0),
})

export const LLMBase = z.looseObject({
  provider: z.string(),
  name: z.string(),
  inputPrice: z.number().optional(),              // deprecated
  outputPrice: z.number().optional(),             // deprecated
  cacheInputPrice: z.number().optional(),         // deprecated
  cacheCreateInputPrice: z.number().optional(),   // deprecated
})

export const OpenAIo3 = LLMBase.extend({
  jbai: z.literal('openai-o3'),
  capabilities: BaseCapabilities.optional()
})

export const OpenAI4oMini = LLMBase.extend({
  jbai: z.literal('openai-gpt-4o-mini'),
  capabilities: BaseCapabilities.optional()
})

export const AnthropicSonnet37 = LLMBase.extend({
  jbai: z.literal('anthropic-claude-3.7-sonnet'),
  capabilities: BaseCapabilities.extend({
    maxOutputTokens: z.number(),
    vision: z.object({
      maxDimension: z.number(),
      maxPixels: z.number(),
      maxDimensionDivider: z.number(),
    }).optional(),
    supportsAssistantMessageResuming: z.boolean().default(() => false),
  }).optional(),
})

export const AnthropicSonnet4 = AnthropicSonnet37.extend({
  jbai: z.literal('anthropic-claude-4-sonnet'),
})

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

export const ChatMessage = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage'),
  content: z.string(),
  kind: z.enum(['User', 'Assistant']).optional(),
})

export const MultiPartChatMessage = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage'),
  parts: z.discriminatedUnion('type', [
    z.looseObject({
      type: z.literal('text'),
      text: z.string(),
    }),
    z.looseObject({
      type: z.literal('image'),
      contentType: z.string(),
      base64: z.string(),
    })
  ]).array(),
  kind: z.enum(['User', 'Assistant']).optional(),
})

export const AssistantChatMessageWithToolUses = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses'),
  content: z.string(),
  toolUses: z.looseObject({
    id: z.string(),
    name: z.string(),
    input: z.object({
      ParameterValue: z.string(),
      name: z.string(),
      value: z.any(),
    }).array()
  }).array(),
})

export const UserChatMessageWithToolResults = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults'),
  toolResults: z.looseObject({
    id: z.string(),
    content: z.string(),
    isError: z.boolean(),
  }).array(),
})

export const AbstractToolProperty = z.looseObject({
  name: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(() => false)
})

export const ToolPrimitiveProperty = AbstractToolProperty.extend({
  MatterhornToolProperty: z.literal('MatterhornToolPrimitiveProperty'),
  primitiveType: z.enum(['STRING', 'INTEGER', 'NUMBER', 'BOOLEAN']).optional(),
})

export const ToolArrayProperty = AbstractToolProperty.extend({
  MatterhornToolProperty: z.literal('MatterhornToolArrayProperty'),
  get itemType() {
    return ToolAnyProperty
  }
})

export const ToolObjectProperty = AbstractToolProperty.extend({
  MatterhornToolProperty: z.literal('MatterhornToolObjectProperty'),
  get properties() {
    return ToolAnyProperty.array()
  }
})

export const ToolAnyProperty = z.union([
  ToolPrimitiveProperty,
  ToolArrayProperty,
  ToolObjectProperty,
])

export const Tools = z.looseObject({
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  params: ToolAnyProperty.array().default(() => ([])),
}).array().default(() => ([]))

export const LlmRequestEvent = z.looseObject({
  type: z.literal('LlmRequestEvent'),
  chat: z.looseObject({
    system: z.string(),
    messages: z.discriminatedUnion('type', [
      ChatMessage,
      MultiPartChatMessage,
      AssistantChatMessageWithToolUses,
      UserChatMessageWithToolResults,
    ]).array(),
    tools: Tools
  }),
  modelParameters: z.looseObject({
    model: LLM,
    prompt_cache_enabled: z.boolean().default(() => false),
    temperature: z.number().optional(),
    n: z.number().optional(),
    stop: z.record(z.string(), z.string()).optional(),
    max_tokens: z.number().optional(),
    user: z.string().optional(),
  }),
  attemptNumber: z.number(),
  id: z.string(),
})

export const LlmResponseEvent = z.looseObject({
  type: z.literal('LlmResponseEvent'),
  id: z.string(),
  answer: z.looseObject({
    llm: LLM,
    contentChoices: z.discriminatedUnion('type', [AIContentAnswerChoice, AIToolUseAnswerChoice]).array(),
    inputTokens: z.number().int().default(() => 0),
    outputTokens: z.number().int().default(() => 0),
    cacheInputTokens: z.number().int().default(() => 0),
    cacheCreateInputTokens: z.number().int().default(() => 0),
    time: z.number().optional(),
  }).transform(answer => {
    const million = 1_000_000
    return {
      ...answer,
      cost: (answer.inputTokens / million) * (answer.llm?.capabilities?.inputPrice ?? answer.llm?.inputPrice ?? 0)
        + (answer.outputTokens / million) * (answer.llm?.capabilities?.outputPrice ?? answer.llm?.outputPrice ?? 0)
        + (answer.cacheInputTokens / million) * (answer.llm?.capabilities?.cacheInputPrice ?? answer.llm?.cacheInputPrice ?? 0)
        + (answer.cacheCreateInputTokens / million) * (answer.llm?.capabilities?.cacheCreateInputPrice ?? answer.llm?.cacheCreateInputPrice ?? 0),
    }
  }),
})
export const TaskSummaryCreatedEvent = z.looseObject({
  type: z.literal('TaskSummaryCreatedEvent'),
  taskSummary: z.string(),
})
export const AgentStateUpdatedEvent = z.looseObject({
  type: z.literal('AgentStateUpdatedEvent'),
  state: z.object({
    issue: z.looseObject({
      description: z.string().optional(),
      editorContext: z.object({
        recentFiles: z.string().array(),
        openFiles: z.string().array(),
      }),
    }),
    observations: z.looseObject({
      // TODO
    }).array(),
    ideInitialState: z.looseObject({
      content: z.string(),
      kind: z.enum(['User', 'Assistant']),
    }).optional(),
  }),
})
export const PlanUpdatedEvent = z.looseObject({
  type: z.literal('PlanUpdatedEvent'),
  plan: z.looseObject({
    description: z.string(),
    status: z.string(),
  }).array(),
})

const ParamsObject = z.record(z.string(), z.any())
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
  actionToExecute: z.looseObject({
    type: z.string(),
    name: z.string(),
    id: z.string().optional(),
    inputParams: z.union([ParamsObject, ParamsArray]).optional(),
    description: z.string().optional(),
  }),
})
export const AgentActionExecutionFailed = AgentActionExecutionStarted.extend({
  type: z.literal('AgentActionExecutionFailed'),
  result: z.looseObject({
    text: z.string(),
    images: z.any().array(),
  }).optional(),
})

export const AgentInteractionStarted = z.looseObject({
  type: z.literal('AgentInteractionStarted'),
  interaction: z.looseObject({
    interactionId: z.looseObject({
      id: z.string(),
    }),
    runCancelableInteraction: z.looseObject({
      name: z.string(),
    }).optional(),
    askInteraction: z.object({
      question: z.string(),
    }).optional(),
  }),
})
export type AgentInteractionStarted = z.infer<typeof AgentInteractionStarted>

export const AgentInteractionFinished = z.object({
  type: z.literal('AgentInteractionFinished'),
  interactionId: z.looseObject({
    id: z.string(),
  }),
})
export type AgentInteractionFinished = z.infer<typeof AgentInteractionFinished>

export const ResponseTextAppeared = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.agent.ResponseTextAppeared'),
  text: z.string(),
})
export type ResponseTextAppeared = z.infer<typeof ResponseTextAppeared>

export const BeforeStepStartedEvent = z.object({
  type: z.literal('BeforeStepStartedEvent'),
  // TODO
})
export const StepMetaInfoAppearedEvent = z.looseObject({
  type: z.literal('StepMetaInfoAppearedEvent'),
  stepName: z.string(),
  stepType: z.string(),
})
export const StepSummaryCreatedEvent = z.looseObject({
  type: z.literal('StepSummaryCreatedEvent'),
})
export const AfterStepFinishedEvent = z.looseObject({
  type: z.literal('AfterStepFinishedEvent'),
  // TODO
})
export const AgentActionExecutionFinished = z.looseObject({
  type: z.literal('AgentActionExecutionFinished'),
  // TODO
})
export const AgentSessionUpdatedEvent = z.looseObject({
  type: z.literal('AgentSessionUpdatedEvent'),
  // TODO
})
export const ActionRequestBuildingStarted = z.looseObject({
  type: z.literal('ActionRequestBuildingStarted'),
  attemptNumber: z.number(),
})
export const ActionRequestBuildingFailed = z.looseObject({
  type: z.literal('ActionRequestBuildingFailed'),
  attemptNumber: z.number(),
})
export const ActionRequestBuildingFinished = z.looseObject({
  type: z.literal('ActionRequestBuildingFinished'),
  attemptNumber: z.number(),
  actionRequest: z.looseObject({
    // TODO
  }),
})
export const TaskResultCreatedEvent = z.looseObject({
  type: z.literal('TaskResultCreatedEvent'),
  // TODO
})
export const TaskReportCreatedEvent = z.looseObject({
  type: z.literal('TaskReportCreatedEvent'),
  // TODO
})
export const SemanticCheckStarted = z.looseObject({
  type: z.literal('SemanticCheckStarted'),
  // TODO
})
export const SemanticCheckFinished = z.looseObject({
  type: z.literal('SemanticCheckFinished'),
  // TODO
})
export const ErrorCheckerStarted = z.looseObject({
  type: z.literal('ErrorCheckerStarted'),
  // TODO
})
export const ErrorCheckerFinished = z.looseObject({
  type: z.literal('ErrorCheckerFinished'),
  // TODO
})
export const EditEvent = z.looseObject({
  type: z.literal('EditEvent'),
  // TODO
})
export const LongDelayDetected = z.looseObject({
  type: z.literal('LongDelayDetected'),
})
export const LlmRequestFailed = z.looseObject({
  type: z.literal('LlmRequestFailed'),
  // TODO
})
export const McpInitStarted = z.looseObject({
  type: z.literal('McpInitStarted'),
  // TODO
})
export const McpInitFinished = z.looseObject({
  type: z.literal('McpInitFinished'),
  // TODO
})
export const UnknownEvent = z.looseObject({
  type: z.string(),
})
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

export const EventRecord = z.looseObject({
  event: Event,
  timestampMs: z.coerce.date(),
  parseError: z.any().optional(),
}).transform(({ timestampMs, ...rest }) => ({ timestamp: timestampMs, ...rest }))
export type EventRecord = z.infer<typeof EventRecord>

export const UnknownEventRecord = z.looseObject({
  event: UnknownEvent,
  timestampMs: z.coerce.date(),
  parseError: z.any().optional(),
}).transform(({ timestampMs, ...rest }) => ({ timestamp: timestampMs, ...rest }))
export type UnknownEventRecord = z.infer<typeof UnknownEventRecord>