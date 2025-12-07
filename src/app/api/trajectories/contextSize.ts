import express from "express"
import * as repl from "node:repl"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../../types"
import { LlmRequestEvent } from "../../../schema/llmRequestEvent"
import { LlmResponseEvent } from "../../../schema/llmResponseEvent"
import { AIContentAnswerChoice } from "../../../schema/AIContentAnswerChoice"
import { AIToolUseAnswerChoice } from "../../../schema/AIToolUseAnswerChoice"
import { EventRecord } from "../../../schema/eventRecord"

export const makeGroupName = (response: LlmResponseEvent) => {
  return `${response.requestEvent?.chat.agentType ?? 'Unknown'} (${response.answer.llm.jbai})`
}

const router = express.Router({ mergeParams: true })

router.use('/api/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// Context size over time API endpoint
// Context size = inputTokens + outputTokens + cacheTokens
// For each provider, the context size must be non-decreasing over time (cumulative max)
router.get('/api/project/:projectId/issue/:issueId/task/:taskId/trajectories/context-size', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task, issue } = req

    // Determine whether to include all tasks in the issue
    const allTasksParam = String((req.query as any)?.allTasks ?? '').toLowerCase()
    const includeAllTasks = allTasksParam === '1' || allTasksParam === 'true' || allTasksParam === 'yes' || allTasksParam === 'on'

    // Collect events from the current task or from all tasks in the issue, preserving task index when needed
    type EvWithTask = { ev: EventRecord, taskIndex: number }
    let withTask: EvWithTask[] = []

    if (includeAllTasks && issue) {
      const tasks = [...(await issue.tasks).values()]
      const eventsArrays = await Promise.all(tasks.map(async (t) => {
        const evs = await t.events
        return evs.map(ev => ({ ev, taskIndex: t.index }))
      }))
      withTask = eventsArrays.flat()
    } else {
      const evs = await task!.events
      withTask = evs.map(ev => ({ ev, taskIndex: task!.index }))
    }

    // Sort all events by timestamp first
    const sorted = withTask.sort((a, b) => a.ev.timestamp.getTime() - b.ev.timestamp.getTime())

    type Row = {
      timestamp: string
      provider: string
      model: string
      contextSize: number
      description?: string
      reasoning?: string
      taskIndex: number
    }

    const rows: Row[] = []

    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i]
      const ev = cur.ev
      if (ev.event.type === 'LlmResponseEvent') {
        const resp: LlmResponseEvent = ev.event
        const provider = makeGroupName(resp)
        const model = resp.answer.llm.name
        const inputTokens = resp.answer.inputTokens ?? 0
        const outputTokens = resp.answer.outputTokens ?? 0
        const cacheInputTokens = resp.answer.cacheInputTokens ?? 0
        const cacheCreateInputTokens = resp.answer.cacheCreateInputTokens ?? 0
        const contextSize = inputTokens + outputTokens + cacheInputTokens + cacheCreateInputTokens

        // Find matching request for reasoning effort
        let reasoning: string | undefined = undefined
        const previous = sorted.slice(0, i).reverse().find((e): e is { ev: { event: LlmRequestEvent, timestamp: Date }, taskIndex: number } => e.ev.event.type === 'LlmRequestEvent' && (e.ev.event as LlmRequestEvent).id === resp.id)
        if (previous) {
          reasoning = (previous.ev.event as LlmRequestEvent).modelParameters.reasoning_effort
        }

        // Build a short description similar to model performance API
        const description = resp.answer.contentChoices.map(choice => {
          const maxLabelLength = 80
          if (choice.type === AIContentAnswerChoice.shape.type.value) {
            return choice.content.length <= maxLabelLength
              ? choice.content
              : choice.content.substring(0, (maxLabelLength/2)-2) + ' ... ' + choice.content.substring(choice.content.length - (maxLabelLength/2)-2)
          } else if (choice.type === AIToolUseAnswerChoice.shape.type.value) {
            return choice.usages.map(usage => {
              const params = JSON.stringify(usage.toolParams.rawJsonObject)
              const trimmedParams = params.length <= maxLabelLength ? params : params.substring(0, (maxLabelLength/2)-2) + ' ... ' + params.substring(params.length - (maxLabelLength/2)-2)
              return usage.toolName + ' ' + trimmedParams
            }).join(', ')
          }
        }).join('')

        rows.push({
          timestamp: ev.timestamp.toISOString(),
          provider,
          model,
          contextSize,
          description,
          reasoning,
          taskIndex: cur.taskIndex,
        })
      } else if (ev.event.type === 'LlmRequestEvent') {
        // In case some token info is available on request, prefer response authoritative values; requests usually don't include tokens
        // Keeping this branch for possible future extension
        const reqEv: LlmRequestEvent = ev.event
        void reqEv
      }
    }

    // Group by provider
    const providerGroups: Record<string, Row[]> = {}
    for (const r of rows) {
      if (!providerGroups[r.provider]) providerGroups[r.provider] = []
      providerGroups[r.provider].push(r)
    }

    const providers = Object.keys(providerGroups).sort()

    res.json({
      includeAllTasks,
      contextData: rows,
      providerGroups,
      providers,
    })
  } catch (error) {
    console.error('Error fetching Context Size data:', error)
    res.status(500).json({ error: 'An error occurred while fetching Context Size data' })
  }
})

export default router
