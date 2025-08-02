import express from 'express'
import { Breadcrumb } from '../components/breadcrumb.js'
import { ReloadButton } from '../components/reloadButton.js'
import { ThemeSwitcher } from '../components/themeSwitcher.js'
import { VersionBanner } from '../components/versionBanner.js'
import { JetBrains } from "../jetbrains.js"
import { ToolUse } from "../schema/assistantChatMessageWithToolUses.js"
import { EventRecord } from "../schema/eventRecord.js"
import { LlmRequestEvent, MatterhornMessage } from "../schema/llmRequestEvent.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { createEventFormatter } from '../utils/eventFormatters.js'
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"

const router = express.Router()

function ToolUseDecorator(klass: string) {
  return (tool: ToolUse) => {
    const params = tool.input.map(param => `<span>${escapeHtml(param.name)}:</span><span>${escapeHtml(param.value)}</span>`).join(', ')
    return `<pre class="${klass}"><code>${escapeHtml(tool.name)}(${params})</code></pre>`
  }
}

function ChatMessageDecorator(klass: string) {
  return (message: MatterhornMessage) => {
    if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage') {
      return `<pre class="${klass}">${escapeHtml(message.content)}</pre>`
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses') {
      const toolUses = message.toolUses.map(ToolUseDecorator(klass)).join('')
      return `<pre class="${klass}">${escapeHtml(message.content)}</pre>${toolUses}`
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults') {
      return `<pre class="${klass}">${message.toolResults.map(res => escapeHtml(res.content)).join('\n')}</pre>`
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage') {
      return `<pre class="${klass}">${escapeHtml(message.parts.map(part => part.contentType).join(''))}</pre>`
    }
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
                  .filter((record: EventRecord): record is { event: LlmRequestEvent, timestamp: Date } => {
                    return record.event.type === 'LlmRequestEvent' && record.event.modelParameters.model.provider === 'Anthropic'
                  })
                  .slice(-1)
                  .map((eventRecord) => {
                    const klass = 'p-4 mt-4 bg-base-content/10'
                    return `<div class="font-mono text-xs border p-2">${[
                      `<pre class="${klass}">${escapeHtml(eventRecord.event.chat.system)}</pre>`,
                      ...eventRecord.event.chat.messages.map(ChatMessageDecorator(klass))
                    ].join('\n')}</div>`
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