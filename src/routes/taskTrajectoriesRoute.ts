import express from 'express'
import fs from 'fs-extra'
import { marked } from "marked"
import path from 'node:path'
import { Breadcrumb } from '../components/breadcrumb.js'
import { collapseIcon } from "../components/collapseIcon.js"
import { expandIcon } from "../components/expandIcon.js"
import { ReloadButton } from '../components/reloadButton.js'
import { ThemeSwitcher } from '../components/themeSwitcher.js'
import { VersionBanner } from '../components/versionBanner.js'
import { JetBrains } from "../jetbrains.js"
import { AgentActionExecutionFinished } from "../schema/agentActionExecutionFinished.js"
import { AgentActionExecutionStarted } from "../schema/agentActionExecutionStarted.js"
import { ToolUse } from "../schema/assistantChatMessageWithToolUses.js"
import { EventRecord } from "../schema/eventRecord.js"
import { LlmRequestEvent, MatterhornMessage } from "../schema/llmRequestEvent.js"
import { Tool } from "../schema/tools.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../utils/getLocaleFromRequest.js"
import { ToggleComponent } from '../utils/toggleComponent.js'

const router = express.Router()

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
    return `<div class="flex flex-col gap-2 p-4 bg-base-content/10 rounded mb-2">
        <div class="py-2"><span class="bg-secondary text-secondary-content p-2 rounded shadow">${escapeHtml(tool.name)}</span></div>
        <div class="flex flex-row">
          <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">Description</div>
          <div class="flex-grow p-2 bg-base-content/10 rounded">${escapeHtml(tool.description?.trim() ?? '')}</div>            
        </div>
        ${params ? '<div class="w-32 pr-2 text-base-content/50 italic text-right">Parameters</div>' : '' }
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
  return (tool: ToolUse) => {
    return ToolCallDecorator(klass, index, 'tool-use-toggle', {
      name: tool.name,
      params: tool.input.rawJsonObject,
      label: 'Tool Request',
    })
  }
}

function MessageDecorator(props: {
  klass: string,
  index: number,
  testIdPrefix: string,
  left: boolean,
  label: string,
  content: string
}) {
  return `
        <div class="relative mb-8 ${props.left ? 'mr-48' : 'ml-48'}">
          ${ToggleComponent({ expandIcon, collapseIcon, testIdPrefix: props.testIdPrefix, index: props.index })}
          <div class="relative">
            <h3 class="absolute -top-3 left-4 bg-primary text-primary-content px-2 py-1 rounded shadow">${props.label}</h3>
            <div class="${props.klass} rounded shadow pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">${props.content}</div>
          </div>
        </div>`
}

function ChatMessageDecorator(klass: string, index: number) {
  return (message: MatterhornMessage) => {
    if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage') {

      return MessageDecorator({
        klass,
        index,
        testIdPrefix: 'chat-message-toggle',
        left: message.kind === 'User',
        label: 'Message',
        content: escapeHtml(message.content),
      })

    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses') {

      return MessageDecorator({
        klass,
        index,
        testIdPrefix: 'chat-assistant-toggle',
        left: message.kind === 'User',
        label: 'Model Response',
        content: escapeHtml(message.content),
      }) + message.toolUses.map((tool, toolIndex) => ToolUseDecorator(klass, index + toolIndex + 1000)(tool)).join('')

    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults') {

      return MessageDecorator({
        klass,
        index,
        testIdPrefix: 'chat-user-toggle',
        left: true,
        label: 'Tool Result',
        content: escapeHtml(message.toolResults.map(res => res.content).join('\n')),
      })

    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage') {

      return MessageDecorator({
        klass,
        index,
        testIdPrefix: 'chat-multipart-toggle',
        left: message.kind === 'User',
        label: 'Multi-part Message',
        content: escapeHtml(message.parts.map(part => part.contentType).join('')),
      })

    }
  }
}

// Task trajectories download route
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/trajectories/download', async (req, res) => {
  const jetBrains = req.app.locals.jetBrains as JetBrains
  try {
    const { projectName, issueId, taskId } = req.params
    const project = await jetBrains.getProjectByName(projectName)
    const issue = await project?.getIssueById(issueId)
    const task = await issue?.getTaskById(taskId)

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    if (!fs.existsSync(task.trajectoriesFile)) {
      return res.status(404).send('Trajectories file not found')
    }

    const filename = path.basename(task.trajectoriesFile)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/jsonl')

    res.sendFile(path.resolve(task.trajectoriesFile))
  } catch (error) {
    console.error('Error downloading trajectories file:', error)
    res.status(500).send('An error occurred while downloading the trajectories file')
  }
})

// Task trajectories page route
router.get('/project/:projectName/issue/:issueId/task/:taskId/trajectories', async (req, res) => {
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
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/reloadPage.js"></script>
        <script src="/js/collapsibleSections.js"></script>
        <script src="/js/taskActionChart.js"></script>
        <script src="/js/taskLlmLatencyChart.js"></script>
        <script src="/js/trajectoryToggle.js"></script>
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
        { label: `Issue ${issueId} Task ${taskId} Trajectory`, testId: 'breadcrumb-task-trajectories' },
      ],
    })}

          <div class="flex gap-2 mb-5" data-testid="ide-icons">
            ${project.ideNames.map(ide => `
              <img src="${jetBrains.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
            `).join('')}
          </div>

          <div class="flex justify-between items-center mb-5 p-4 bg-base-200 rounded-lg">
            <div class="text-sm text-base-content/70" data-testid="task-date">Created: ${new Date(task.created).toLocaleString(getLocaleFromRequest(req))}</div>
            <a href="/api/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/trajectories/download" class="btn btn-primary btn-sm">Download Trajectories as JSONL</a>
          </div>
          ${task.context.description ? `
              <div class="bg-base-200 text-base-content p-4 mb-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-primary">Task Description</h3>
                <div class="prose prose-sm max-w-none">${marked(escapeHtml(task.context.description))}</div>
              </div>
            ` : ''}

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

          <div class="collapsible-section collapsed mb-5 bg-base-200 rounded-lg border border-base-300 collapsed" data-testid="llm-latency-section">
            <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-200 rounded-lg hover:bg-base-100 transition-colors duration-200" data-testid="llm-latency-header">
              <h3 class="text-xl font-bold text-primary m-0">Model Latency</h3>
              <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
            </div>
            <div class="collapsible-content p-4 hidden transition-all duration-300">
              <div class="mb-4">
                <div id="llm-latency-provider-filters" class="flex flex-wrap gap-2 mb-4">
                  <!-- Provider checkboxes will be populated by JavaScript -->
                </div>
              </div>
              <div class="w-full">
                <canvas id="llm-latency-chart" class="w-full max-w-full h-96 border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
              </div>
            </div>
          </div>
          
          <div class="bg-base-200 text-base-content rounded-lg p-4 border border-base-300">
            <h3 class="text-xl font-bold text-primary mb-8">Message Trajectories</h3>

            ${events.length > 0 ?
              events
                .filter((record: EventRecord): record is { event: LlmRequestEvent, timestamp: Date } => {
                  return (record.event.type === 'LlmRequestEvent' && !record.event.modelParameters.model.isSummarizer)
                })
                .map((record, index) => {
                  const klass = 'p-4 mt-4 bg-base-content/10'
                  const messages = [
                    ...(index === 0 ? [
                      MessageDecorator({
                        klass,
                        index: index + 10000,
                        testIdPrefix: 'system-request-toggle',
                        left: true,
                        label: 'System Message',
                        content: escapeHtml(record.event.chat.system),
                      }),
                      MessageDecorator({
                        klass,
                        index: index + 10001,
                        testIdPrefix: 'user-tools-toggle',
                        left: true,
                        label: 'Tools',
                        content: record.event.chat.tools.length 
                          ? record.event.chat.tools.map(ToolDecorator()).join('')
                          : 'No tools listed',
                      }),
                    ] : []),
                    ...record.event.chat.messages.map((message, msgIndex) => ChatMessageDecorator(klass, index * 100 + msgIndex)(message)),
                  ].join('\n')
                  return `<div class="font-mono text-xs">${messages}</div>`
                })
                .join('')
              : '<div class="p-4 text-center text-base-content/70" data-testid="no-events-message">No events found for this task</div>'
          }
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

// Task action timeline API endpoint
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/trajectories/timeline', async (req, res) => {
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
            inputParamValue: JSON.stringify(
              (typeof e.event.actionToExecute.inputParams === 'object' && 'rawJsonObject' in e.event.actionToExecute.inputParams)
                ? e.event.actionToExecute.inputParams.rawJsonObject
                : e.event.actionToExecute.inputParams
            ),
          }
          : {}),
      }))

    res.json(actionEvents)
  } catch (error) {
    console.error('Error fetching action timeline events:', error)
    res.status(500).json({ error: 'An error occurred while fetching action timeline events' })
  }
})

// LLM request latency API endpoint
router.get('/api/project/:projectName/issue/:issueId/task/:taskId/trajectories/llm-latency', async (req, res) => {
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

    // Sort all events by timestamp first
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Calculate latencies by measuring time since previous event of any type
    const latencyData: Array<{
      timestamp: string
      provider: string
      model: string
      latency: number
    }> = []

    for (let i = 1 ; i < sortedEvents.length ; i++) {
      const currentEvent = sortedEvents[i]

      // Only process LLM response events
      if (currentEvent.event.type === 'LlmResponseEvent') {
        const previousEvent = sortedEvents[i - 1]

        const latency = currentEvent.timestamp.getTime() - previousEvent.timestamp.getTime()
        const provider = currentEvent.event.answer.llm.groupName
        const model = currentEvent.event.answer.llm.name

        latencyData.push({
          timestamp: currentEvent.timestamp.toISOString(),
          provider,
          model,
          latency,
        })
      }
    }

    // Group by provider
    const providerGroups = latencyData.reduce((acc, item) => {
      if (!acc[item.provider]) {
        acc[item.provider] = []
      }
      acc[item.provider].push(item)
      return acc
    }, {} as Record<string, typeof latencyData>)

    // Get unique providers
    const providers = Object.keys(providerGroups).sort()

    res.json({
      latencyData,
      providerGroups,
      providers,
    })
  } catch (error) {
    console.error('Error fetching LLM latency data:', error)
    res.status(500).json({ error: 'An error occurred while fetching LLM latency data' })
  }
})

export default router