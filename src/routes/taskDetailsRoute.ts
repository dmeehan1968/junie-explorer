import express from 'express'
import { Breadcrumb } from '../components/breadcrumb.js'
import { ReloadButton } from '../components/reloadButton.js'
import { ThemeSwitcher } from '../components/themeSwitcher.js'
import { VersionBanner } from '../components/versionBanner.js'
import { JetBrains } from "../jetbrains.js"
import { ToolUseAnswer } from "../schema/AIToolUseAnswerChoice.js"
import { ToolUse } from "../schema/assistantChatMessageWithToolUses.js"
import { EventRecord } from "../schema/eventRecord.js"
import { LlmRequestEvent, MatterhornMessage } from "../schema/llmRequestEvent.js"
import { ContentAnswer, LlmResponseEvent } from "../schema/llmResponseEvent.js"
import { ToolParams } from "../schema/toolParams.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { createEventFormatter } from '../utils/eventFormatters.js'
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { ToggleComponent } from '../utils/toggleComponent.js'

// SVG icons for expand and collapse states
const expandIcon = `<svg 
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="#000000"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8" />
  <path d="M3 16.2V21m0 0h4.8M3 21l6-6" />
  <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" />
  <path d="M3 7.8V3m0 0h4.8M3 3l6 6" />
</svg>`

const collapseIcon = `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 20L15 15M15 15V19M15 15H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 20L9 15M9 15V19M9 15H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 4L15 9M15 9V5M15 9H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 4L9 9M9 9V5M9 9H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const router = express.Router()

function ToolUseDecorator(klass: string, index: number) {
  return (tool: ToolUse) => {
    console.log(tool)
    const params = Object.entries(tool.input.rawJsonObject).map(([key, value]) => `<span>${escapeHtml(key)}:</span><span>"${escapeHtml(String(value))}"</span>`).join(', ')
    const content = `${escapeHtml(tool.name)}(${params})`
    return `
      <div class="content-cell-container relative">
        ${ToggleComponent({
          expandIcon,
          collapseIcon,
          testIdPrefix: 'tool-use-toggle',
          index
        })}
        <pre class="${klass} font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out"><code>${content}</code></pre>
      </div>`
  }
}

function ToolUseAnswerDecorator(klass: string, index: number) {
  return (tool: ToolUseAnswer) => {
    console.log(tool)
    const params = Object.entries(tool.toolParams.rawJsonObject).map(([key, value]) => `<span>${escapeHtml(key)}:</span><span>"${escapeHtml(String(value))}"</span>`).join(', ')
    const content = `${escapeHtml(tool.toolName)}(${params})`
    return `
      <div class="content-cell-container relative">
        ${ToggleComponent({
          expandIcon,
          collapseIcon,
          testIdPrefix: 'tool-use-answer-toggle',
          index
        })}
        <pre class="${klass} font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out"><code>${content}</code></pre>
      </div>`
  }
}

function ChatMessageDecorator(klass: string, index: number) {
  return (message: MatterhornMessage) => {
    if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage') {
      return `
        <div class="content-cell-container relative">
          ${ToggleComponent({
            expandIcon,
            collapseIcon,
            testIdPrefix: 'chat-message-toggle',
            index
          })}
          <pre class="${klass} font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${escapeHtml(message.content)}</pre>
        </div>`
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses') {
      const toolUses = message.toolUses.map((tool, toolIndex) => ToolUseDecorator(klass, index + toolIndex + 1000)(tool)).join('')
      return `
        <div class="content-cell-container relative">
          ${ToggleComponent({
            expandIcon,
            collapseIcon,
            testIdPrefix: 'chat-assistant-toggle',
            index
          })}
          <pre class="${klass} font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${escapeHtml(message.content)}</pre>
        </div>${toolUses}`
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults') {
      return `
        <div class="content-cell-container relative">
          ${ToggleComponent({
            expandIcon,
            collapseIcon,
            testIdPrefix: 'chat-user-toggle',
            index
          })}
          <pre class="${klass} font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${message.toolResults.map(res => escapeHtml(res.content)).join('\n')}</pre>
        </div>`
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage') {
      return `
        <div class="content-cell-container relative">
          ${ToggleComponent({
            expandIcon,
            collapseIcon,
            testIdPrefix: 'chat-multipart-toggle',
            index
          })}
          <pre class="${klass} font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${escapeHtml(message.parts.map(part => part.contentType).join(''))}</pre>
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
      <div class="content-cell-container relative">
        ${ToggleComponent({
          expandIcon,
          collapseIcon,
          testIdPrefix: 'chat-answer-toggle',
          index
        })}
        <pre class="${klass} font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out"><code>${escapeHtml(answer.content)}</code></pre>
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
    const eventFormatter = createEventFormatter()

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task ${taskId} Details - ${escapeHtml(issue.name)}</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/taskDetailsFilters.js"></script>
        <script src="/js/trajectoryToggle.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Task ${taskId} Details</h1>
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
        { label: `Task ${taskId} Details`, testId: 'breadcrumb-task-details' },
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

          ${events.length > 0 ? `
            <div class="mb-5">
              <div class="flex flex-wrap gap-2 mb-5 p-4 bg-base-200 rounded items-center">
                <div class="font-bold mr-2 flex items-center">Filter by Event Type:</div>
                <div class="cursor-pointer transition-all duration-300 rounded flex items-center gap-1 event-filter all-none-toggle" data-testid="all-none-toggle">
                  <label class="cursor-pointer text-sm font-bold py-1 px-2 rounded transition-all duration-300 bg-primary border border-primary-300 text-primary-content">All/None</label>
                </div>
                ${(await task.eventTypes).map(eventType => `
                  <div class="cursor-pointer transition-all duration-300 rounded flex items-center gap-1 event-filter" data-event-type="${escapeHtml(eventType)}" data-testid="event-filter-${escapeHtml(eventType)}">
                    <label class="cursor-pointer text-sm py-1 px-2 rounded transition-all duration-300 bg-secondary border border-secondary-300 text-secondary-content">${escapeHtml(eventType)}</label>
                  </div>
                `).join('')}
              </div>
            </div>
              ${
        events
          .filter((record: EventRecord): record is { event: LlmRequestEvent | LlmResponseEvent, timestamp: Date } => {
            return (record.event.type === 'LlmRequestEvent' && !record.event.modelParameters.model.isSummarizer)
              || (record.event.type === 'LlmResponseEvent' && !record.event.answer.llm.isSummarizer)
          })
          // .slice(-1)
          .map((record, index) => {
            const klass = 'p-4 mt-4 bg-base-content/10'
            if (record.event.type === 'LlmRequestEvent') {
              return `<div class="font-mono text-xs border p-4 mb-4"><h3>Request</h3>${[
                ...(index===0 ? [`
                  <div class="content-cell-container relative">
                    ${ToggleComponent({
                      expandIcon,
                      collapseIcon,
                      testIdPrefix: 'system-message-toggle',
                      index: index + 10000
                    })}
                    <pre class="${klass} font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${escapeHtml(record.event.chat.system)}</pre>
                  </div>`] : []),
                ...record.event.chat.messages.map((message, msgIndex) => ChatMessageDecorator(klass, index * 100 + msgIndex)(message)),
              ].join('\n')}</div>`
            } else if (record.event.type === 'LlmResponseEvent') {               
              return `<div class="font-mono text-xs border p-4 mb-4"><h3>Response</h3>${record.event.answer.contentChoices.map((choice, choiceIndex) => ChatAnswerDecorator(klass, index * 100 + choiceIndex + 50)(choice)).join('')}</div>`
            }
            return ''
          })
          .join('')
      }
            `
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

export default router