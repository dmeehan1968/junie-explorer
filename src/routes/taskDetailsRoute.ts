import express from 'express'
import { marked } from "marked"
import { Breadcrumb } from '../components/breadcrumb.js'
import { collapseIcon } from "../components/collapseIcon.js"
import { expandIcon } from "../components/expandIcon.js"
import { ReloadButton } from '../components/reloadButton.js'
import { ThemeSwitcher } from '../components/themeSwitcher.js'
import { VersionBanner } from '../components/versionBanner.js'
import { JetBrains } from "../jetbrains.js"
import { ToolUseAnswer } from "../schema/AIToolUseAnswerChoice.js"
import { ToolUse } from "../schema/assistantChatMessageWithToolUses.js"
import { EventRecord } from "../schema/eventRecord.js"
import { LlmRequestEvent, MatterhornMessage } from "../schema/llmRequestEvent.js"
import { ContentAnswer, LlmResponseEvent } from "../schema/llmResponseEvent.js"
import { AgentActionExecutionFinished } from "../schema/agentActionExecutionFinished.js"
import { AgentActionExecutionStarted } from "../schema/agentActionExecutionStarted.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { ToggleComponent } from '../utils/toggleComponent.js'

const router = express.Router()

function ToolCallDecorator(klass: string, index: number, testIdPrefix: string, tool: {
  name: string,
  params: Record<string, any>,
  label: string
}) {
  const params = Object.entries(tool.params).map(([key, value]) => {
    return `<div class="flex flex-row">
      <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">${escapeHtml(key)}:</div>
      <div class="flex-grow bg-info text-info-content p-2">${escapeHtml(String(value))}</div>
    </div>`
  }).join('')
  const content = `<div class="py-2"><span class="bg-secondary text-secondary-content p-2">${escapeHtml(tool.name)}</span></div>${params}`
  return `
    <div class="relative">
      ${ToggleComponent({ expandIcon, collapseIcon, testIdPrefix, index, })}
      <div class="relative">
        <h3 class="absolute -top-2 left-2 bg-primary text-primary-content px-2 py-1">${tool.label}</h3>
        <div class="${klass} flex flex-col gap-1 pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${content}</div>        
      </div>
    </div>
  `
}

function ToolUseDecorator(klass: string, index: number) {
  return (tool: ToolUse) => {
    return ToolCallDecorator(klass, index, 'tool-use-toggle', { name: tool.name, params: tool.input.rawJsonObject, label: 'Tool Call' })
  }
}

function ToolUseAnswerDecorator(klass: string, index: number) {
  return (tool: ToolUseAnswer) => {
    return ToolCallDecorator(klass, index, 'tool-use-answer-toggle', { name: tool.toolName, params: tool.toolParams.rawJsonObject, label: 'Tool Request' })
  }
}

function ChatMessageDecorator(klass: string, index: number) {
  return (message: MatterhornMessage) => {
    if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage') {
      return `
        <div class="relative">
          ${ToggleComponent({
        expandIcon,
        collapseIcon,
        testIdPrefix: 'chat-message-toggle',
        index,
      })}
          <div class="relative">
            <h3 class="absolute -top-2 left-2 bg-primary text-primary-content px-2 py-1">Message</h3>
            <div class="${klass} pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${escapeHtml(message.content)}</div>
          </div>
        </div>`
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses') {
      const toolUses = message.toolUses.map((tool, toolIndex) => ToolUseDecorator(klass, index + toolIndex + 1000)(tool)).join('')
      return `
        <div class="relative">
          ${ToggleComponent({
        expandIcon,
        collapseIcon,
        testIdPrefix: 'chat-assistant-toggle',
        index,
      })}
          <div class="relative">
            <h3 class="absolute -top-2 left-2 bg-primary text-primary-content px-2 py-1">Message</h3>
            <div class="${klass} pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${escapeHtml(message.content)}</div>
          </div>
        </div>${toolUses}`
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults') {
      return `
        <div class="relative">
          ${ToggleComponent({
        expandIcon,
        collapseIcon,
        testIdPrefix: 'chat-user-toggle',
        index,
      })}
          <div class="relative">
            <h3 class="absolute -top-2 left-2 bg-primary text-primary-content px-2 py-1">Tool Result</h3>
            <div class="${klass} pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${message.toolResults.map(res => escapeHtml(res.content)).join('\n')}</div>
          </div>
        </div>`
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage') {
      return `
        <div class="relative">
          ${ToggleComponent({
        expandIcon,
        collapseIcon,
        testIdPrefix: 'chat-multipart-toggle',
        index,
      })}
          <div class="relative">
            <h3 class="absolute -top-2 left-2 bg-primary text-primary-content px-2 py-1">Multi-Part Message</h3>
            <div class="${klass} pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${escapeHtml(message.parts.map(part => part.contentType).join(''))}</div>
          </div>
        </div>`
    }
  }
}

function ChatAnswerDecorator(klass: string, index: number) {
  return (answer: ContentAnswer) => {
    let toolUses = ''
    if (answer.type === 'com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice') {
      toolUses = answer.usages.map((usage, usageIndex) => ToolUseAnswerDecorator(klass, index + usageIndex + 2000)(usage)).join('')
    }
    return `
      <div class="relative">
        ${ToggleComponent({
      expandIcon,
      collapseIcon,
      testIdPrefix: 'chat-answer-toggle',
      index,
    })}
          <div class="relative">
            <h3 class="absolute -top-2 left-2 bg-primary text-primary-content px-2 py-1">Message</h3>
            <div class="${klass} pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${escapeHtml(answer.content)}</div>
          </div>
      </div>${toolUses}`
  }
}

// Task details page route
router.get('/project/:projectName/issue/:issueId/task/:taskId/details', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    // Load events
    const events = await task.events
    const locale = getLocaleFromRequest(req)

    // Check if there are action events for conditional rendering
    const hasActionEvents = events.some(e => e.event.type === 'AgentActionExecutionStarted')

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Junie Explorer: ${issueId} Task ${taskId} Trajectory - ${escapeHtml(issue.name)}</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/taskDetailsFilters.js"></script>
        <script src="/js/trajectoryToggle.js"></script>
        <script src="/js/collapsibleSections.js"></script>
        <script src="/js/taskActionChart.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer: Issue ${issueId} Task ${taskId} Trajectory</h1>
            <div class="flex items-center gap-3">
              ${ThemeSwitcher()}
              ${ReloadButton()}
            </div>
          </div>
          ${VersionBanner(jetBrains.version)}
          ${Breadcrumb({
      items: [
        { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
        { label: projectName, href: `/project/${encodeURIComponent(projectName)}`, testId: 'breadcrumb-project-name' },
        {
          label: issue.name,
          href: `/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}`,
          testId: 'breadcrumb-issue-name',
        },
        { label: `Issue ${issueId} Task ${taskId} Trajectory`, testId: 'breadcrumb-task-details' },
      ],
    })}

          <div class="flex gap-2 mb-5" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
            `).join('')}
          </div>

          <div class="flex justify-between items-center mb-5 p-4 bg-base-200 rounded-lg">
            <div class="text-sm text-base-content/70" data-testid="task-date">Created: ${new Date(task.created).toLocaleString(getLocaleFromRequest(req))}</div>
          </div>
          ${task.context.description ? `
              <div class="bg-base-200 text-base-content p-4 mb-8 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-primary">Task Description</h3>
                <div class="prose prose-sm max-w-none">${marked(escapeHtml(task.context.description))}</div>
              </div>
            ` : ''}

          ${hasActionEvents ? `
            <div class="collapsible-section collapsed mb-5 bg-base-100 rounded-lg border border-base-300 collapsed" data-testid="action-timeline-section">
              <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-100 rounded-lg hover:bg-base-200 transition-colors duration-200" data-testid="action-timeline-header">
                <h3 class="text-xl font-bold text-primary m-0">Action Timeline</h3>
                <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
              </div>
              <div class="collapsible-content px-4 pb-4 hidden transition-all duration-300">
                <div class="w-full">
                  <canvas id="action-timeline-chart" class="w-full max-w-full border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
                </div>
              </div>
            </div>
          ` : ''}

          ${events.length > 0 ? `
              ${events
        .filter((record: EventRecord): record is { event: LlmRequestEvent | LlmResponseEvent, timestamp: Date } => {
          return (record.event.type === 'LlmRequestEvent' && !record.event.modelParameters.model.isSummarizer)
            || (record.event.type === 'LlmResponseEvent' && !record.event.answer.llm.isSummarizer)
        })
        .map((record, index) => {
          const klass = 'p-4 mt-4 bg-base-content/10'
          if (record.event.type === 'LlmRequestEvent') {
            return `<div class="font-mono text-xs bg-base-content/10 p-4 pt-8 mb-4 mr-48 relative">
                      <h3 class="absolute -top-2 left-2 py-1 px-2 bg-primary text-primary-content">Junie</h3>
                      ${[
              ...(index === 0 ? [`
                          <div class="relative">
                            ${ToggleComponent({
                expandIcon,
                collapseIcon,
                testIdPrefix: 'system-message-toggle',
                index: index + 10000,
              })}
                            <div class="relative">
                              <h3 class="absolute -top-2 left-2 bg-primary text-primary-content px-2 py-1">System Message</h3>
                              <div class="${klass} pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${escapeHtml(record.event.chat.system)}</div>        
                            </div>
                          </div>`] : []),
              ...record.event.chat.messages.map((message, msgIndex) => ChatMessageDecorator(klass, index * 100 + msgIndex)(message)),
            ].join('\n')}
                        </div>`
          } else if (record.event.type === 'LlmResponseEvent') {
            return `<div class="font-mono text-xs bg-base-content/10 p-4 pt-8 mb-4 ml-48 relative">
                      <h3 class="absolute -top-2 left-2 py-1 px-2 bg-primary text-primary-content">LLM</h3>
                      ${record.event.answer.contentChoices.map((choice, choiceIndex) => ChatAnswerDecorator(klass, index * 100 + choiceIndex + 50)(choice)).join('')}</div>`
          }
          return ''
        })
        .join('')
      }`
      : '<div class="p-4 text-center text-base-content/70" data-testid="no-events-message">No events found for this task</div>'
    }
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating task details page:', error)
    res.status(500).send('An error occurred while generating the task details page')
  }
})

// Task action timeline API endpoint
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/details/timeline', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Get events for the task
    const events = await task.events

    // Filter and flatten action events for Action Timeline
    const actionEvents = events
      .filter((e): e is { event: AgentActionExecutionStarted | AgentActionExecutionFinished, timestamp: Date } =>
        e.event.type === 'AgentActionExecutionStarted' || e.event.type === 'AgentActionExecutionFinished',
      )
      .map(e => ({
        timestamp: e.timestamp.toISOString(),
        eventType: e.event.type,
        ...(e.event.type === 'AgentActionExecutionStarted'
          ? {
            actionName: e.event.actionToExecute.name,
            inputParamValue: JSON.stringify(Object.values(e.event.actionToExecute.inputParams ?? {})[0]),
          }
          : {})
      }))

    res.json(actionEvents)
  } catch (error) {
    console.error('Error fetching action timeline events:', error)
    res.status(500).json({ error: 'An error occurred while fetching action timeline events' })
  }
})

export default router