import express from 'express'
import { entityLookupMiddleware } from "../middleware/entityLookupMiddleware.js"
import { AppRequest, AppResponse } from "../types.js"
import { Breadcrumb } from '../../components/breadcrumb.js'
import { collapseIcon } from "../../components/collapseIcon.js"
import { expandIcon } from "../../components/expandIcon.js"
import { ReloadButton } from '../../components/reloadButton.js'
import { TaskCard } from '../../components/taskCard.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { VersionBanner } from '../../components/versionBanner.js'
import { AgentActionExecutionFinished } from "../../schema/agentActionExecutionFinished.js"
import { ActionRequestBuildingFailed } from "../../schema/actionRequestBuildingFailed.js"
import { ToolUseAnswer } from "../../schema/AIToolUseAnswerChoice.js"
import { EventRecord } from "../../schema/eventRecord.js"
import { LlmRequestEvent, MatterhornMessage } from "../../schema/llmRequestEvent.js"
import { LlmResponseEvent } from "../../schema/llmResponseEvent.js"
import { ChatMessagePart } from "../../schema/multiPartChatMessage.js"
import { Tool } from "../../schema/tools.js"
import { escapeHtml } from "../../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../../utils/getLocaleFromRequest.js"
import { themeAttributeForHtml } from '../../utils/themeCookie.js'
import { ToggleComponent } from '../../utils/toggleComponent.js'

const router = express.Router({ mergeParams: true })

router.use('/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

function ToolDecorator() {
  return (tool: Tool) => {
    const params = Object.entries(tool.parameters).map(([name, { description, type, ...param }]) => {
      return `<div class="flex flex-row">
          <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">${escapeHtml(name)}</div>
          <div class="flex flex-row flex-grow gap-2">
            <div class="flex-grow bg-base-content/10 p-2 rounded">${escapeHtml(description ? description : JSON.stringify(param, null, 2))}</div>        
            <div class="flex-shrink-0 bg-base-content/10 text-base-content/50 p-2 rounded">${escapeHtml(type)}</div>
          </div>
        </div>`
    }).join('')
    return `<div class="flex flex-col gap-2 p-4 bg-base-content/10 rounded mt-4 mb-8 relative">
        <div class="absolute -top-4 left-4 py-2"><span class="bg-secondary text-secondary-content p-2 rounded shadow">${escapeHtml(tool.name)}</span></div>
        <div class="flex flex-row pt-2">
          <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">Description</div>
          <div class="flex-grow p-2 bg-base-content/10 rounded">${escapeHtml(tool.description?.trim() ?? '')}</div>            
        </div>
        ${params ? '<div class="w-32 pr-2 text-base-content/50 italic text-right">Parameters</div>' : ''}
        ${params}
      </div>`
  }
}

function ToolCallDecorator(klass: string, index: number, testIdPrefix: string, tool: {
  name: string,
  params: Record<string, any>,
  label: string
}) {
  const params = Object.entries(tool.params).map(([key, value]) => {
    return `<div class="flex flex-row">
      <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">${escapeHtml(key)}:</div>
      <div class="flex-grow bg-info text-info-content p-2 rounded">${escapeHtml(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))}</div>
    </div>`
  }).join('')
  const content = `<div class="py-2"><span class="bg-secondary text-secondary-content p-2 rounded shadow">${escapeHtml(tool.name)}</span></div>${params}`
  return `
    <div class="relative ml-48 mb-8">
      ${ToggleComponent({ expandIcon, collapseIcon, testIdPrefix, index })}
      <div class="relative">
        <h3 class="absolute -top-3 left-4 bg-primary text-primary-content px-2 py-1 rounded shadow">${tool.label}</h3>
        <div class="${klass} rounded shadow flex flex-col gap-1 pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${content}</div>        
      </div>
    </div>
  `
}

function ToolUseDecorator(klass: string, index: number) {
  return (tool: ToolUseAnswer) => {
    return ToolCallDecorator(klass, index, 'tool-use-toggle', {
      name: tool.toolName,
      params: tool.toolParams.rawJsonObject,
      label: 'Tool Request',
    })
  }
}

function MessageDecorator(props: {
  klass: string,
  index: number,
  testIdPrefix: string,
  left: boolean,
  label?: string,
  content: string
}) {
  return `
        <div class="relative mb-8 ${props.left ? 'mr-48' : 'ml-48'}">
          ${ToggleComponent({ expandIcon, collapseIcon, testIdPrefix: props.testIdPrefix, index: props.index })}
          <div class="relative">
            <h3 class="absolute -top-3 left-4 bg-primary text-primary-content px-2 py-1 rounded shadow z-50">${props.label}</h3>
            <div class="${props.klass} rounded shadow pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${props.content}</div>
          </div>
        </div>`
}

function MultiPartMessage(part: ChatMessagePart) {
  if (part.type == 'text') {
    return escapeHtml(part.text)
  } else if (part.type == 'image') {
    const src = `data:${escapeHtml(part.contentType)};base64,${escapeHtml(part.base64)}`
    return `<img src="${src}" data-fullsrc="${src}" alt="Image" class="chat-image-thumb max-w-64 max-h-64 rounded shadow cursor-zoom-in" />`
  }
  return ''
}

function ChatMessageDecorator(klass: string, index: number) {
  return (message: MatterhornMessage) => {
    if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage') {

      return MessageDecorator({
        klass,
        index,
        testIdPrefix: 'chat-message-toggle',
        left: message.kind === 'User',
        label: message.kind === 'User' ? 'Message' : 'Model Response',
        content: escapeHtml(message.content),
      })

    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage') {

      return message.parts.map(part => {
        return MessageDecorator({
          klass,
          index,
          testIdPrefix: 'chat-multipart-toggle',
          left: message.kind === 'User',
          label: part.type === 'image' ? 'Image' : 'Message',
          content: MultiPartMessage(part),
        })
      }).join('')
    }
  }
  // we don't process these, as they are covered by the response and action events
  // } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses') {
  // } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults') {
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
    const locale = getLocaleFromRequest(req)

    // Check if there are action events for conditional rendering
    const hasActionEvents = events.some(e => e.event.type === 'AgentActionExecutionStarted')
    const hasMetrics = (await project.metrics).metricCount > 0

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en" ${themeAttributeForHtml(req.headers.cookie)}>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Junie Explorer: ${project.name} ${issue.name} ${task.id} Trajectories</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.css">
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.js"></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/collapsibleSections.js"></script>
        <script src="/js/taskActionChart.js"></script>
        <script src="/js/taskModelPerformanceChart.js"></script>
        <script src="/js/trajectoryToggle.js"></script>
        <script src="/js/taskRawData.js"></script>
        <script src="/js/imageModal.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer: ${project.name}</h1>
            <div class="flex items-center gap-3">
              ${ThemeSwitcher()}
              ${ReloadButton()}
            </div>
          </div>
          ${VersionBanner(jetBrains?.version)}
          ${Breadcrumb({
      items: [
        { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
        { label: project.name, href: `/project/${encodeURIComponent(project.name)}`, testId: 'breadcrumb-project-name' },
        { label: issue.name, testId: 'breadcrumb-issue-name' },
      ],
    })}

          <div class="flex gap-2 mb-5" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains?.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
            `).join('')}
          </div>

          <div class="mb-5">
            ${
              await TaskCard({
                projectName: project.name,
                issueId: issue.id,
                taskIndex: task.index,
                task,
                locale: getLocaleFromRequest(req),
                issueTitle: issue.name,
                actionsHtml: hasMetrics ? `<a href="/api/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}/task/${encodeURIComponent(task.index)}/trajectories/download" class=\"btn btn-primary btn-sm\">Download Trajectories as JSONL</a>` : '',
                tasksCount: (await issue.tasks).size,
                tasksDescriptions: [...(await issue.tasks).values()].map(t => t?.context?.description ?? ''),
                currentTab: 'trajectories',
              })
            }
          </div>

          ${hasActionEvents ? `
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
          ` : ''}

          <div class="collapsible-section collapsed mb-5 bg-base-200 rounded-lg border border-base-300 collapsed" data-testid="model-performance-section" data-has-metrics="${hasMetrics}">
            <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-200 rounded-lg hover:bg-base-100 transition-colors duration-200" data-testid="model-performance-header">
              <h3 class="text-xl font-bold text-primary m-0">Model Performance</h3>
              <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
            </div>
            <div class="collapsible-content p-4 hidden transition-all duration-300">
              <div class="mb-4">
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-3 flex-wrap justify-between">
                    <div id="model-performance-provider-filters" class="join flex flex-wrap">
                      <!-- Provider buttons will be populated by JavaScript -->
                    </div>
                    <div class="flex items-center gap-3 ml-auto">
                      <div id="model-performance-metric-toggle" class="join" data-has-metrics="${hasMetrics}">
                        ${hasMetrics ? `
                        <button class="btn btn-sm join-item btn-primary" data-metric="both" aria-pressed="true">Both</button>
                        <button class="btn btn-sm join-item" data-metric="latency" aria-pressed="false">Latency</button>
                        <button class="btn btn-sm join-item" data-metric="tps" aria-pressed="false">Tokens/sec</button>
                        ` : `
                        <button class="btn btn-sm join-item btn-primary" data-metric="latency" aria-pressed="true">Latency</button>
                        `}
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
          
          <div class="bg-base-200 text-base-content rounded-lg p-4 border border-base-300">
            <h3 class="text-xl font-bold text-primary mb-8">Message Trajectories</h3>

            ${processEvents(events)}
        </div>
        </div>
        
        <!-- Image Modal -->
        <div id="imageModal" class="fixed inset-0 bg-black/80 hidden items-center justify-center z-50">
          <div class="relative w-[95vw] h-[95vh] max-w-6xl">
            <button id="closeImageModal" class="absolute -top-3 -right-3 bg-base-100 text-base-content rounded-full w-10 h-10 flex items-center justify-center shadow" aria-label="Close image viewer">&times;</button>
            <img id="imageModalImg" src="" alt="Full Image" class="w-full h-full object-contain rounded" />
          </div>
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating task trajectories page:', error)
    res.status(500).send('An error occurred while generating the task trajectories page')
  }
})

function processEvents(events: EventRecord[] = []) {
  if (events.length === 0) {
    return '<div class="p-4 text-center text-base-content/70" data-testid="no-events-message">No events found for this task</div>'
  }

  let didOutputInitialContext = false

  return events
    .filter((record: EventRecord): record is { event: LlmRequestEvent | LlmResponseEvent | ActionRequestBuildingFailed | AgentActionExecutionFinished, timestamp: Date } => {
      return (
        (record.event.type === 'LlmRequestEvent' && !record.event.modelParameters.model.isSummarizer)
        || (record.event.type === 'LlmResponseEvent')
        || record.event.type === 'AgentActionExecutionFinished'
        || record.event.type === 'ActionRequestBuildingFailed'
      )
    })
    .map((record, index) => {
      const klass = 'p-4 mt-4 bg-base-content/10'
      const messages: string[] = []

      if (record.event.type === 'LlmRequestEvent') {
        if (!didOutputInitialContext) {
          messages.push(
            MessageDecorator({
              klass,
              index: index + 10000,
              testIdPrefix: 'system-request-toggle',
              left: true,
              label: 'System Message',
              content: escapeHtml(record.event.chat.system),
            }),
          )

          messages.push(MessageDecorator({
            klass,
            index: index + 10001,
            testIdPrefix: 'user-tools-toggle',
            left: true,
            label: 'Tools',
            content: record.event.chat.tools.length
              ? record.event.chat.tools.map(ToolDecorator()).join('')
              : 'No tools listed',
          }))

          messages.push(...record.event.chat.messages.map((message, msgIndex) => ChatMessageDecorator(klass, index * 100 + msgIndex)(message) ?? ''))

          didOutputInitialContext = true

        }

      } else if (record.event.type === 'LlmResponseEvent') {

        if (record.event.answer.llm.isSummarizer) {

          messages.push(
            ...record.event.answer.contentChoices.map(choice => {

              return MessageDecorator({
                klass: klass + (!!choice.content ? '' : ' bg-warning text-warning-content'),
                index,
                testIdPrefix: 'summarizer-assistant-toggle',
                left: false,
                label: 'Summary',
                content: escapeHtml(choice.content || '<unexpectedly_empty>'),
              })

            }).join('')
          )

        } else {

          if (didOutputInitialContext) {

            messages.push(
              ...record.event.answer.contentChoices.map(choice => {

                const toolUses = choice.type === 'com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice'
                  ? choice.usages.map((tool, toolIndex) => ToolUseDecorator(klass, index + toolIndex + 1000)(tool)).join('')
                  : ''

                return MessageDecorator({
                  klass: klass + (!!choice.content ? '' : ' bg-warning text-warning-content'),
                  index,
                  testIdPrefix: 'chat-assistant-toggle',
                  left: false,
                  label: 'Model Response',
                  content: escapeHtml(choice.content || '<unexpectedly_empty>'),
                }) + toolUses

              }).join('')
            )

          }

        }

      } else if (record.event.type === 'AgentActionExecutionFinished') {

        // synthetic_submit is a special case and called at the start of a task, so doesn't need to be logged
        if (record.event.actionToExecute.id !== 'synthetic_submit') {

          messages.push(MessageDecorator({
            klass,
            index: index + 10002,
            testIdPrefix: 'chat-user-toggle',
            left: true,
            label: 'Tool Result',
            content: escapeHtml(record.event.result.text),
          }))

          if (record.event.result.images && record.event.result.images.length) {
            // TODO: handle images as well (when we know what the shape is)
            console.log('Unhandled tool result image', record.event.result.images)
          }

        }

      } else if (record.event.type === 'ActionRequestBuildingFailed') {
        messages.push(MessageDecorator({
          klass: klass + ' bg-error text-error-content',
          index: index + 10002,
          testIdPrefix: 'chat-user-toggle',
          left: true,
          label: 'Tool Error',
          content: escapeHtml(record.event.serializableThrowable?.message ?? 'Unspecified error'),
        }))

      }

      return `<div class="font-mono text-xs">
        ${messages.join('')}
      </div>`
    })
    .join('')
}

export default router