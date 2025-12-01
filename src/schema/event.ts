import * as z from "zod"
import { ActionRequestBuildingFailed } from "./actionRequestBuildingFailed"
import { ActionRequestBuildingFinished } from "./actionRequestBuildingFinished"
import { ActionRequestBuildingStarted } from "./actionRequestBuildingStarted"
import { AfterArtifactBuildingFinished } from "./afterArtifactBuildingFinished"
import { AfterStepFinishedEvent } from "./afterStepFinishedEvent"
import { AgentActionExecutionFailed } from "./agentActionExecutionFailed"
import { AgentActionExecutionFinished } from "./agentActionExecutionFinished"
import { AgentActionExecutionStarted } from "./agentActionExecutionStarted"
import { AgentInteractionFinished } from "./agentInteractionFinished"
import { AgentInteractionStarted } from "./agentInteractionStarted"
import { AgentSessionUpdatedEvent } from "./agentSessionUpdatedEvent"
import { AgentStateUpdatedEvent } from "./agentStateUpdatedEvent"
import { BeforeArtifactBuildingStarted } from "./beforeArtifactBuildingStarted"
import { BeforeStepStartedEvent } from "./beforeStepStartedEvent"
import { EditEvent } from "./editEvent"
import { ErrorCheckerFinished } from "./errorCheckerFinished"
import { ErrorCheckerStarted } from "./errorCheckerStarted"
import { LlmRequestEvent } from "./llmRequestEvent"
import { LlmRequestFailed } from "./llmRequestFailed"
import { LlmResponseEvent } from "./llmResponseEvent"
import { LongDelayDetected } from "./longDelayDetected"
import { McpInitFinished } from "./mcpInitFinished"
import { McpInitStarted } from "./mcpInitStarted"
import { MemoryExtractedEvent } from "./memoryExtractedEvent"
import { MemoryReflectionCompletedEvent } from "./memoryReflectionCompletedEvent"
import { PairedGroupEventFinished } from "./pairedGroupEventFinished"
import { PairedGroupEventStarted } from "./pairedGroupEventStarted"
import { PlanUpdatedEvent } from "./planUpdatedEvent"
import { ResponseTextAppeared } from "./responseTextAppeared"
import { SemanticCheckFinished } from "./semanticCheckFinished"
import { SemanticCheckStarted } from "./semanticCheckStarted"
import { SerializableEventSerializationError } from "./serializableEventSerializationError"
import { StepMetaInfoAppearedEvent } from "./stepMetaInfoAppearedEvent"
import { StepSummaryCreatedEvent } from "./stepSummaryCreatedEvent"
import { TaskReportCreatedEvent } from "./taskReportCreatedEvent"
import { TaskResultCreatedEvent } from "./taskResultCreatedEvent"
import { TaskSummaryCreatedEvent } from "./taskSummaryCreatedEvent"

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
  SerializableEventSerializationError,
  PairedGroupEventStarted,
  PairedGroupEventFinished,
  MemoryReflectionCompletedEvent,
  MemoryExtractedEvent,
])
export type Event = z.infer<typeof Event>