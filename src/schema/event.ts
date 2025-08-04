import * as z from "zod"
import { ActionRequestBuildingFailed } from "./actionRequestBuildingFailed.js"
import { ActionRequestBuildingFinished } from "./actionRequestBuildingFinished.js"
import { ActionRequestBuildingStarted } from "./actionRequestBuildingStarted.js"
import { AfterArtifactBuildingFinished } from "./afterArtifactBuildingFinished.js"
import { AfterStepFinishedEvent } from "./afterStepFinishedEvent.js"
import { AgentActionExecutionFailed } from "./agentActionExecutionFailed.js"
import { AgentActionExecutionFinished } from "./agentActionExecutionFinished.js"
import { AgentActionExecutionStarted } from "./agentActionExecutionStarted.js"
import { AgentInteractionFinished } from "./agentInteractionFinished.js"
import { AgentInteractionStarted } from "./agentInteractionStarted.js"
import { AgentSessionUpdatedEvent } from "./agentSessionUpdatedEvent.js"
import { AgentStateUpdatedEvent } from "./agentStateUpdatedEvent.js"
import { BeforeArtifactBuildingStarted } from "./beforeArtifactBuildingStarted.js"
import { BeforeStepStartedEvent } from "./beforeStepStartedEvent.js"
import { EditEvent } from "./editEvent.js"
import { ErrorCheckerFinished } from "./errorCheckerFinished.js"
import { ErrorCheckerStarted } from "./errorCheckerStarted.js"
import { LlmRequestEvent } from "./llmRequestEvent.js"
import { LlmRequestFailed } from "./llmRequestFailed.js"
import { LlmResponseEvent } from "./llmResponseEvent.js"
import { LongDelayDetected } from "./longDelayDetected.js"
import { McpInitFinished } from "./mcpInitFinished.js"
import { McpInitStarted } from "./mcpInitStarted.js"
import { PlanUpdatedEvent } from "./planUpdatedEvent.js"
import { SemanticCheckFinished } from "./semanticCheckFinished.js"
import { SemanticCheckStarted } from "./semanticCheckStarted.js"
import { StepMetaInfoAppearedEvent } from "./stepMetaInfoAppearedEvent.js"
import { StepSummaryCreatedEvent } from "./stepSummaryCreatedEvent.js"
import { TaskReportCreatedEvent } from "./taskReportCreatedEvent.js"
import { TaskResultCreatedEvent } from "./taskResultCreatedEvent.js"
import { TaskSummaryCreatedEvent } from "./taskSummaryCreatedEvent.js"
import { ResponseTextAppeared } from "./responseTextAppeared.js"

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