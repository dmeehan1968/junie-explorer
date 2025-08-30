import { Html } from "@kitajs/html"
import express from 'express'
import { AppBody } from "../../components/appBody.js"
import { AppHead } from "../../components/appHead.js"
import { AppHeader } from "../../components/appHeader.js"
import { Breadcrumb } from '../../components/breadcrumb.js'
import { CollapseIcon } from "../../components/collapseIcon.js"
import { Conditional } from "../../components/conditional.js"
import { ExpandIcon } from "../../components/expandIcon.js"
import { HtmlPage } from "../../components/htmlPage.js"
import { ReloadButton } from '../../components/reloadButton.js'
import { StatsButton } from '../../components/statsButton.js'
import { TaskCard } from '../../components/taskCard.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { ToggleComponent } from '../../components/toggleComponent.js'
import { VersionBanner } from '../../components/versionBanner.js'
import { ActionRequestBuildingFailed } from "../../schema/actionRequestBuildingFailed.js"
import { ToolUseAnswer } from "../../schema/AIToolUseAnswerChoice.js"
import { AgentActionExecutionFinished } from "../../schema/agentActionExecutionFinished.js"
import { EventRecord } from "../../schema/eventRecord.js"
import { LlmRequestEvent, MatterhornMessage } from "../../schema/llmRequestEvent.js"
import { LlmResponseEvent } from "../../schema/llmResponseEvent.js"
import { ChatMessagePart } from "../../schema/multiPartChatMessage.js"
import { Tool } from "../../schema/tools.js"
import { escapeHtml } from "../../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../../utils/getLocaleFromRequest.js"
import { entityLookupMiddleware } from "../middleware/entityLookupMiddleware.js"
import { AppRequest, AppResponse } from "../types.js"

const router = express.Router({ mergeParams: true })

router.use('/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

const ToolDecorator = ({ tool }: { tool: Tool }) => {
  return (
    <div class="flex flex-col gap-2 p-4 bg-base-content/10 rounded mt-4 mb-8 relative">
      <div class="absolute -top-4 left-4 py-2">
        <span class="bg-secondary text-secondary-content p-2 rounded shadow">{tool.name}</span>
      </div>
      <div class="flex flex-row pt-2">
        <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">Description</div>
        <div class="flex-grow p-2 bg-base-content/10 rounded">{escapeHtml(tool.description?.trim() ?? '')}</div>
      </div>
      {Object.entries(tool.parameters).length > 0 && (
        <div class="w-32 pr-2 text-base-content/50 italic text-right">Parameters</div>
      )}
      {Object.entries(tool.parameters).map(([name, { description, type, ...param }]) => (
        <div class="flex flex-row">
          <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">{name}</div>
          <div class="flex flex-row flex-grow gap-2">
            <div class="flex-grow bg-base-content/10 p-2 rounded">
              {escapeHtml(description ? description : JSON.stringify(param, null, 2))}
            </div>
            <div class="flex-shrink-0 bg-base-content/10 text-base-content/50 p-2 rounded">{type}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

const ToolCallDecorator = ({ klass, index, testIdPrefix, tool }: {
  klass: string,
  index: number,
  testIdPrefix: string,
  tool: { name: string, params: Record<string, any>, label: string }
}) => {
  return (
    <div class="relative ml-48 mb-8">
      <ToggleComponent expandIcon={<ExpandIcon />} collapseIcon={<CollapseIcon />} testIdPrefix={testIdPrefix} index={index} />
      <div class="relative">
        <h3 class="absolute -top-3 left-4 bg-primary text-primary-content px-2 py-1 rounded shadow">{tool.label}</h3>
        <div class={`${klass} rounded shadow flex flex-col gap-1 pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out`}>
          <div class="py-2">
            <span class="bg-secondary text-secondary-content p-2 rounded shadow">{tool.name}</span>
          </div>
          {Object.entries(tool.params).map(([key, value]) => (
            <div class="flex flex-row">
              <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">{key}:</div>
              <div class="flex-grow bg-info text-info-content p-2 rounded">
                {escapeHtml(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ToolUseDecorator = ({ klass, index, tool }: { klass: string, index: number, tool: ToolUseAnswer }) => {
  return (
    <ToolCallDecorator
      klass={klass}
      index={index}
      testIdPrefix="tool-use-toggle"
      tool={{
        name: tool.toolName,
        params: tool.toolParams.rawJsonObject,
        label: 'Tool Request',
      }}
    />
  )
}

const MessageDecorator = (props: {
  klass: string,
  index: number,
  testIdPrefix: string,
  left: boolean,
  label?: string,
  content: string | JSX.Element
}) => {
  return (
    <div class={`relative mb-8 ${props.left ? 'mr-48' : 'ml-48'}`}>
      <ToggleComponent
        expandIcon={<ExpandIcon />}
        collapseIcon={<CollapseIcon />}
        testIdPrefix={props.testIdPrefix}
        index={props.index}
      />
      <div class="relative">
        <h3 class="absolute -top-3 left-4 bg-primary text-primary-content px-2 py-1 rounded shadow z-50">
          {props.label}
        </h3>
        <div class={`${props.klass} rounded shadow pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out`}>
          {typeof props.content === 'string' ? props.content : props.content}
        </div>
      </div>
    </div>
  )
}

const MultiPartMessage = ({ part }: { part: ChatMessagePart }) => {
  if (part.type === 'text') {
    return <>{part.text}</>
  } else if (part.type === 'image') {
    const src = `data:${part.contentType};base64,${part.base64}`
    return (
      <img
        src={src}
        data-fullsrc={src}
        alt="Image"
        class="chat-image-thumb max-w-64 max-h-64 rounded shadow cursor-zoom-in"
      />
    )
  }
  return null
}

const ChatMessageDecorator = ({ klass, index, message }: { klass: string, index: number, message: MatterhornMessage }) => {
  if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage') {
    return (
      <MessageDecorator
        klass={klass}
        index={index}
        testIdPrefix="chat-message-toggle"
        left={message.kind === 'User'}
        label={message.kind === 'User' ? 'Message' : 'Model Response'}
        content={escapeHtml(message.content)}
      />
    )
  } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage') {
    return (
      <>
        {message.parts.map((part, partIndex) => (
          <MessageDecorator
            klass={klass}
            index={index}
            testIdPrefix="chat-multipart-toggle"
            left={message.kind === 'User'}
            label={part.type === 'image' ? 'Image' : 'Message'}
            content={<MultiPartMessage part={part} />}
          />
        ))}
      </>
    )
  }
  return null
  // we don't process these, as they are covered by the response and action events
  // } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses') {
  // } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults') {
}

// JSX Components for trajectory sections
const ActionTimelineSection = ({ hasActionEvents }: { hasActionEvents: boolean }) => {
  if (!hasActionEvents) return null

  return (
    <div class="collapsible-section collapsed mb-5 bg-base-200 rounded-lg border border-base-300 collapsed" data-testid="action-timeline-section">
      <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-200 rounded-lg hover:bg-base-100 transition-colors duration-200" data-testid="action-timeline-header">
        <h3 class="text-xl font-bold text-primary m-0">Action Timeline</h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
      </div>
      <div class="collapsible-content p-4 hidden transition-all duration-300">
        <div class="w-full">
          <canvas id="action-timeline-chart" class="w-full max-w-full border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
        </div>
      </div>
    </div>
  )
}

const ModelPerformanceSection = ({ hasMetrics }: { hasMetrics: boolean }) => {
  return (
    <div class="collapsible-section collapsed mb-5 bg-base-200 rounded-lg border border-base-300 collapsed" data-testid="model-performance-section" data-has-metrics={String(hasMetrics)}>
      <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-200 rounded-lg hover:bg-base-100 transition-colors duration-200" data-testid="model-performance-header">
        <h3 class="text-xl font-bold text-primary m-0">Model Performance</h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
      </div>
      <div class="collapsible-content p-4 hidden transition-all duration-300">
        <div class="mb-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3 flex-wrap justify-between">
              <div id="model-performance-provider-filters" class="join flex flex-wrap">
                {/* Provider buttons will be populated by JavaScript */}
              </div>
              <div class="flex items-center gap-3 ml-auto">
                <div id="model-performance-metric-toggle" class="join">
                  <Conditional condition={hasMetrics}>
                    <button class="btn btn-sm join-item btn-primary" data-metric="both" aria-pressed="true">Both</button>
                    <button class="btn btn-sm join-item" data-metric="latency" aria-pressed="false">Latency</button>
                    <button class="btn btn-sm join-item" data-metric="tps" aria-pressed="false">Tokens/sec</button>
                  </Conditional>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="w-full">
          <canvas id="model-performance-chart" class="w-full max-w-full h-96 border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
        </div>
      </div>
    </div>
  )
}

const MessageTrajectoriesSection = ({ events }: { events: EventRecord[] }) => {
  return (
    <div class="bg-base-200 text-base-content rounded-lg p-4 border border-base-300">
      <h3 class="text-xl font-bold text-primary mb-8">Message Trajectories</h3>
      <ProcessedEvents events={events} />
    </div>
  )
}

const ImageModal = () => {
  return (
    <div id="imageModal" class="fixed inset-0 bg-black/80 hidden items-center justify-center z-50">
      <div class="relative w-[95vw] h-[95vh] max-w-6xl">
        <button id="closeImageModal" class="absolute -top-3 -right-3 bg-base-100 text-base-content rounded-full w-10 h-10 flex items-center justify-center shadow" aria-label="Close image viewer">&times;</button>
        <img id="imageModalImg" src="" alt="Full Image" class="w-full h-full object-contain rounded" />
      </div>
    </div>
  )
}

// Task trajectories page route
router.get('/project/:projectId/issue/:issueId/task/:taskId/trajectories', async (req: AppRequest, res: AppResponse) => {
  try {
    const { jetBrains, project, issue, task } = req

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    // Load events
    const events = await task.events

    // Check if there are action events for conditional rendering
    const hasActionEvents = events.some(e => e.event.type === 'AgentActionExecutionStarted')
    const hasMetrics = project.hasMetrics
    
    const tasksCount = (await issue.tasks).size
    const tasksDescriptions = [...(await issue.tasks).values()].map(t => t?.context?.description ?? '')

    // Generate JSX page
    const page = <HtmlPage cookies={req.cookies}>
      <AppHead title={`${project.name} ${issue.name} ${task.id} Trajectories`}>
        <script src={"https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"}></script>
        <script src={"https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"}></script>
        <link rel="stylesheet" href={"https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.css"}/>
        <script src={"https://code.jquery.com/jquery-3.6.0.min.js"}></script>
        <script src={"https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.js"}></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/collapsibleSections.js"></script>
        <script src="/js/taskActionChart.js"></script>
        <script src="/js/taskModelPerformanceChart.js"></script>
        <script src="/js/trajectoryToggle.js"></script>
        <script src="/js/taskRawData.js"></script>
        <script src="/js/imageModal.js"></script>
      </AppHead>
      <AppBody>
        <AppHeader title={project.name} actions={[<ThemeSwitcher/>, <StatsButton/>, <ReloadButton/>]}/>
        <VersionBanner version={jetBrains?.version}/>
        <Breadcrumb items={[
          { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
          { label: project.name, href: `/project/${encodeURIComponent(project.name)}`, testId: 'breadcrumb-project-name' },
          { label: issue.name, testId: 'breadcrumb-issue-name' },
        ]}/>

        <div class="flex gap-2 mb-5" data-testid="ide-icons">
          {project.ideNames.map((ide: string) => (
            <img src={jetBrains?.getIDEIcon(ide)} alt={ide} title={ide} class="w-8 h-8" />
          ))}
        </div>

        <div class="mb-5">
          {await TaskCard({
            projectName: project.name,
            issueId: issue.id,
            taskIndex: task.index,
            task,
            locale: getLocaleFromRequest(req),
            issueTitle: issue.name,
            actionsHtml: hasMetrics ? `<a href="/api/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}/task/${encodeURIComponent(task.index)}/trajectories/download" class="btn btn-primary btn-sm">Download Trajectories as JSONL</a>` : '',
            tasksCount,
            tasksDescriptions,
            currentTab: 'trajectories',
          })}
        </div>

        <ActionTimelineSection hasActionEvents={hasActionEvents} />
        <ModelPerformanceSection hasMetrics={hasMetrics} />
        <MessageTrajectoriesSection events={events} />
      </AppBody>
      <ImageModal />
    </HtmlPage>

    res.send(await page)
  } catch (error) {
    console.error('Error generating task trajectories page:', error)
    res.status(500).send('An error occurred while generating the task trajectories page')
  }
})

const ProcessedEvents = ({ events }: { events: EventRecord[] }) => {
  if (events.length === 0) {
    return (
      <div class="p-4 text-center text-base-content/70" data-testid="no-events-message">
        No events found for this task
      </div>
    )
  }

  let didOutputInitialContext = false
  const klass = 'p-4 mt-4 bg-base-content/10'
  
  const filteredEvents = events.filter((record: EventRecord): record is { 
    event: LlmRequestEvent | LlmResponseEvent | ActionRequestBuildingFailed | AgentActionExecutionFinished, 
    timestamp: Date 
  } => {
    return (
      (record.event.type === 'LlmRequestEvent' && !record.event.modelParameters.model.isSummarizer)
      || (record.event.type === 'LlmResponseEvent')
      || record.event.type === 'AgentActionExecutionFinished'
      || record.event.type === 'ActionRequestBuildingFailed'
    )
  })

  return (
    <>
      {filteredEvents.map((record, index, records) => {
        const messages: JSX.Element[] = []

        if (record.event.type === 'LlmRequestEvent') {
          if (!didOutputInitialContext) {
            messages.push(
              <MessageDecorator
                klass={klass}
                index={index + 10000}
                testIdPrefix="system-request-toggle"
                left={true}
                label="System Message"
                content={escapeHtml(record.event.chat.system)}
              />
            )

            messages.push(
              <MessageDecorator
                klass={klass}
                index={index + 10001}
                testIdPrefix="user-tools-toggle"
                left={true}
                label="Tools"
                content={
                  record.event.chat.tools.length ? (
                    <>
                      {record.event.chat.tools.map((tool, toolIndex) => (
                        <ToolDecorator tool={tool} />
                      ))}
                    </>
                  ) : (
                    'No tools listed'
                  )
                }
              />
            )

            messages.push(
              ...record.event.chat.messages.map((message, msgIndex) => (
                <ChatMessageDecorator klass={klass} index={index * 100 + msgIndex} message={message} />
              )).filter(Boolean)
            )

            didOutputInitialContext = true
          }
        } else if (record.event.type === 'LlmResponseEvent') {
          if (record.event.answer.llm.isSummarizer) {
            messages.push(
              ...record.event.answer.contentChoices.map((choice, choiceIndex) => (
                <MessageDecorator
                  klass={klass + (!!choice.content ? '' : ' bg-warning text-warning-content')}
                  index={index}
                  testIdPrefix="summarizer-assistant-toggle"
                  left={false}
                  label="Summary"
                  content={escapeHtml(choice.content || '<unexpectedly_empty>')}
                />
              ))
            )
          } else {
            const latency = record.event.answer.time
            const previous = records.slice(0, index).reverse().find((rec): rec is { event: LlmRequestEvent, timestamp: Date } => 
              rec.event.type === 'LlmRequestEvent' && rec.event.id === record.event.id
            )

            messages.push(
              ...record.event.answer.contentChoices.map((choice, choiceIndex) => {
                const toolUses = choice.type === 'com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice' 
                  ? choice.usages.map((tool, toolIndex) => (
                      <ToolUseDecorator klass={klass} index={index + toolIndex + 1000} tool={tool} />
                    ))
                  : []

                return (
                  <div>
                    <MessageDecorator
                      klass={klass + (!!choice.content ? '' : ' bg-warning text-warning-content')}
                      index={index}
                      testIdPrefix="chat-assistant-toggle"
                      left={false}
                      label={`Model Response <span class="text-primary-content/50">${(latency/1000).toFixed(2)}s/${previous?.event.modelParameters.reasoning_effort}</span>`}
                      content={escapeHtml(choice.content || '<unexpectedly_empty>')}
                    />
                    {toolUses}
                  </div>
                )
              })
            )
          }
        } else if (record.event.type === 'AgentActionExecutionFinished') {
          messages.push(
            <MessageDecorator
              klass={klass}
              index={index + 10002}
              testIdPrefix="chat-user-toggle"
              left={true}
              label="Tool Result"
              content={escapeHtml(record.event.result.text)}
            />
          )

          if (record.event.result.images && record.event.result.images.length) {
            // TODO: handle images as well (when we know what the shape is)
            console.log('Unhandled tool result image', record.event.result.images)
          }
        } else if (record.event.type === 'ActionRequestBuildingFailed') {
          messages.push(
            <MessageDecorator
              klass={klass + ' bg-error text-error-content'}
              index={index + 10002}
              testIdPrefix="chat-user-toggle"
              left={true}
              label="Tool Error"
              content={escapeHtml(record.event.serializableThrowable?.message ?? 'Unspecified error')}
            />
          )
        }

        return (
          <div class="font-mono text-xs">
            {messages}
          </div>
        )
      })}
    </>
  )
}

export default router